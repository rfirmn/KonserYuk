// =============================================================================
// TICKET PURCHASE WORKER - BullMQ Consumer
// =============================================================================
// Worker ini memproses pembelian tiket secara ASYNCHRONOUS dari queue.
//
// KENAPA ASYNCHRONOUS?
// 1. Mencegah RACE CONDITION pada flash sale (ribuan request bersamaan)
// 2. Atomic operations dengan database transaction
// 3. Reliable processing dengan retry mechanism
// 4. Mengurangi beban HTTP server
//
// ALUR PEMBELIAN (Queue-based):
// 1. User klik "Beli" → Request masuk ke QUEUE (tidak langsung ke DB)
// 2. Worker mengambil job dari queue SATU PER SATU (serial processing)
// 3. Worker melakukan database transaction dengan ATOMIC decrement
// 4. Jika sukses: create ticket & transaction, kirim email
// 5. Jika gagal: retry or mark as failed
//
// ATOMIC DECOUPLING (Prevent Race Condition):
// - Menggunakan Event.decrement() dengan WHERE kuota > 0
// - Database level lock mencegah overselling
// - Guaranteed only sell tickets sampai kuota habis
// =============================================================================

const { Worker } = require('bullmq');
const { Ticket, Event, User, Transaction, Voucher, sequelize } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { generateQRCode } = require('../utils/qrcode');
const { sendTicketEmail } = require('../utils/email');

// Redis connection config (sama seperti di queue.js)
const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false
};

// -----------------------------------------------------------------------------
// WORKER PROCESSOR FUNCTION - Main business logic
// -----------------------------------------------------------------------------
/**
 * Process ticket purchase job
 * @param {Object} job - BullMQ job object
 * @param {Object} job.data - Job data
 * @param {number} job.data.user_id - ID user yang membeli
 * @param {number} job.data.event_id - ID event yang dibeli
 * @param {string} [job.data.voucher_code] - Kode voucher (opsional)
 * @returns {Promise<Object>} Result object dengan ticket & transaction data
 */
async function processTicketPurchase(job) {
    const { user_id, event_id, voucher_code } = job.data;

    console.log(`⟳ Processing ticket purchase job ${job.id} for user ${user_id}, event ${event_id}`);

    // Update progress: 10%
    await job.updateProgress(10);

    // ===========================================================================
    // DATABASE TRANSACTION - untuk memastikan atomicity
    // ===========================================================================
    // Semua operasi database dibungkus dalam transaction
    // Jika ada yang gagal, semua operasi akan di-rollback
    const t = await sequelize.transaction();

    try {
        // -------------------------------------------------------------------------
        // STEP 1: Validasi Event
        // -------------------------------------------------------------------------
        const event = await Event.findByPk(event_id, { transaction: t });

        if (!event) {
            await t.rollback();
            throw new Error('Event tidak ditemukan');
        }

        // Update progress: 20%
        await job.updateProgress(20);

        // -------------------------------------------------------------------------
        // STEP 2: ATOMIC DECREMENT - CRITICAL untuk mencegah race condition
        // -------------------------------------------------------------------------
        // Menggunakan decrement() dengan WHERE condition:
        // - Decrement HANYA jika kuota > 0
        // - Database melakukan locking pada row
        // - Jika kuota = 0, affectedRows = 0 (tidak ada update)
        // - Guaranteed tidak akan oversell!

        const [affectedRows] = await Event.decrement(
            'kuota',
            {
                by: 1,
                where: {
                    id: event_id,
                    kuota: { [Op.gt]: 0 } // HANYA decrement jika kuota > 0
                },
                transaction: t
            }
        );

        // Validasi: apakah decrement berhasil?
        if (affectedRows === 0) {
            // Kuota habis! Rollback transaction
            await t.rollback();
            throw new Error('Kuota tiket sudah habis');
        }

        console.log(`✓ Kuota decremented successfully for event ${event_id}`);

        // Update progress: 40%
        await job.updateProgress(40);

        // -------------------------------------------------------------------------
        // STEP 3: Hitung harga dengan voucher (jika ada)
        // -------------------------------------------------------------------------
        let total_harga = parseFloat(event.harga);

        if (voucher_code) {
            const voucher = await Voucher.findOne({
                where: { kode: voucher_code },
                transaction: t
            });

            if (voucher) {
                const now = new Date();
                if (now >= voucher.aktif_dari && now <= voucher.aktif_sampai) {
                    // Apply diskon (asumsi diskon dalam persen)
                    total_harga -= total_harga * (voucher.diskon / 100);

                    // Validasi harga tidak negatif
                    if (total_harga < 0) {
                        total_harga = 0;
                    }

                    console.log(`✓ Voucher applied: ${voucher.kode} (${voucher.diskon}%)`);
                } else {
                    console.log(`⚠ Voucher ${voucher_code} sudah tidak aktif`);
                }
            } else {
                console.log(`⚠ Voucher ${voucher_code} tidak ditemukan`);
            }
        }

        // Update progress: 50%
        await job.updateProgress(50);

        // -------------------------------------------------------------------------
        // STEP 4: Generate QR Code untuk tiket
        // -------------------------------------------------------------------------
        const kode_qr = uuidv4();
        const qrCodeDataURL = await generateQRCode(kode_qr);

        // Update progress: 60%
        await job.updateProgress(60);

        // -------------------------------------------------------------------------
        // STEP 5: Create Ticket di database
        // -------------------------------------------------------------------------
        const ticket = await Ticket.create({
            user_id,
            event_id,
            kode_qr,
            qr_image: qrCodeDataURL,
            total_harga,
            status: 'aktif',
            waktu_beli: new Date()
        }, { transaction: t });

        console.log(`✓ Ticket created: ${ticket.id}`);

        // Update progress: 70%
        await job.updateProgress(70);

        // -------------------------------------------------------------------------
        // STEP 6: Create Transaction record
        // -------------------------------------------------------------------------
        const order_id = `ORDER-${Date.now()}-${uuidv4()}`;

        const transaction = await Transaction.create({
            user_id,
            ticket_id: ticket.id,
            order_id,
            total_bayar: total_harga,
            status_pembayaran: 'success', // Langsung success (bypass Midtrans untuk testing)
            payment_type: 'queue_processing',
            transaction_time: new Date()
        }, { transaction: t });

        console.log(`✓ Transaction created: ${transaction.id}`);

        // Update progress: 80%
        await job.updateProgress(80);

        // -------------------------------------------------------------------------
        // STEP 7: COMMIT transaction
        // -------------------------------------------------------------------------
        // Semua operasi berhasil, commit ke database
        await t.commit();
        console.log(`✓ Transaction committed successfully for job ${job.id}`);

        // -------------------------------------------------------------------------
        // STEP 8: Send email tiket (OUTSIDE transaction)
        // -------------------------------------------------------------------------
        // Email dikirim di luar transaction agar tidak memperlambat commit
        // Jika email gagal, transaksi tetap sukses (email bisa di-retry terpisah)
        try {
            const user = await User.findByPk(user_id);

            if (user && user.email) {
                await sendTicketEmail(user.email, {
                    event: event,
                    ticket: ticket,
                    qrCode: qrCodeDataURL
                });

                console.log(`✓ Email sent to ${user.email}`);
            }
        } catch (emailError) {
            // Log error tapi jangan throw (transaksi sudah sukses)
            console.error('⚠ Failed to send email, but transaction succeeded:', emailError.message);
        }

        // Update progress: 100%
        await job.updateProgress(100);

        // -------------------------------------------------------------------------
        // RETURN result
        // -------------------------------------------------------------------------
        return {
            success: true,
            message: 'Tiket berhasil dibeli',
            ticket: {
                id: ticket.id,
                kode_qr: ticket.kode_qr,
                qr_image: qrCodeDataURL,
                total_harga: ticket.total_harga,
                status: ticket.status
            },
            transaction: {
                id: transaction.id,
                order_id: transaction.order_id,
                status_pembayaran: transaction.status_pembayaran
            }
        };

    } catch (error) {
        // -------------------------------------------------------------------------
        // ERROR HANDLING - Rollback transaction jika masih active
        // -------------------------------------------------------------------------
        if (t && !t.finished) {
            await t.rollback();
            console.log(`✗ Transaction rolled back for job ${job.id}`);
        }

        console.error(`✗ Job ${job.id} failed:`, error.message);

        // Throw error untuk trigger retry mechanism
        throw error;
    }
}

// -----------------------------------------------------------------------------
// CREATE WORKER INSTANCE
// -----------------------------------------------------------------------------
const ticketPurchaseWorker = new Worker(
    'ticket-purchase', // Queue name (sama seperti di queue.js)
    processTicketPurchase, // Processor function
    {
        connection,

        // Worker concurrency: berapa job yang diproses bersamaan
        // Default: 5 (bisa di-adjust sesuai kebutuhan)
        concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 5,

        // Limiter: rate limiting untuk mencegah overload
        limiter: {
            max: 100,      // Maksimal 100 jobs
            duration: 1000  // Per 1 detik (100 jobs/second)
        }
    }
);

// -----------------------------------------------------------------------------
// WORKER EVENT HANDLERS - untuk monitoring dan logging
// -----------------------------------------------------------------------------

ticketPurchaseWorker.on('completed', (job, result) => {
    console.log(`✓ Job ${job.id} completed successfully:`, result.message);
});

ticketPurchaseWorker.on('failed', (job, err) => {
    console.error(`✗ Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
});

ticketPurchaseWorker.on('progress', (job, progress) => {
    console.log(`⟳ Job ${job.id} progress: ${progress}%`);
});

ticketPurchaseWorker.on('error', (err) => {
    console.error('✗ Worker error:', err);
});

// Worker ready
ticketPurchaseWorker.on('ready', () => {
    console.log('✓ Ticket Purchase Worker is ready and listening for jobs...');
});

// Worker closing
ticketPurchaseWorker.on('closing', () => {
    console.log('⊗ Ticket Purchase Worker is closing...');
});

// Worker closed
ticketPurchaseWorker.on('closed', () => {
    console.log('⊗ Ticket Purchase Worker has been closed');
});

// -----------------------------------------------------------------------------
// GRACEFUL SHUTDOWN
// -----------------------------------------------------------------------------
async function shutdown() {
    console.log('\n⊗ Shutting down worker gracefully...');

    try {
        await ticketPurchaseWorker.close();
        console.log('✓ Worker closed successfully');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error during worker shutdown:', error);
        process.exit(1);
    }
}

// Handle termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------
module.exports = ticketPurchaseWorker;
