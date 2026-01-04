// =============================================================================
// TICKET CONTROLLER - dengan ASYNC QUEUE PROCESSING
// =============================================================================
// Controller ini sudah direfactor untuk high-traffic flash sale scenarios:
//
// PERUBAHAN UTAMA:
// SEBELUM: purchaseTicket() langsung create ticket di database (synchronous)
// SEKARANG: purchaseTicket() add job ke queue, return "processing" status
//
// ALUR BARU:
// 1. User POST /api/tickets/purchase
// 2. Server validate dan add job ke BullMQ queue
// 3. Server return job_id dan status "processing" (immediate response)
// 4. Worker process job secara async dengan atomic operations
// 5. User polling GET /api/tickets/purchase-status/:jobId untuk cek status
// 6. Saat completed, user mendapatkan ticket data
//
// BENEFIT:
// - Non-blocking: User langsung dapat response
// - Scalable: Bisa handle ribuan concurrent requests
// - Reliable: Retry mechanism untuk failed purchases
// - Atomic: Prevent race condition dengan queue + transaction
// =============================================================================

const { Ticket, Event, User } = require('../models');
const { addTicketPurchaseJob, getJobStatus } = require('../config/queue');

// -----------------------------------------------------------------------------
// PURCHASE TICKET - Add job to queue (ASYNC)
// -----------------------------------------------------------------------------
/**
 * Endpoint untuk membeli tiket event
 * Request langsung masuk ke queue, tidak langsung create ticket
 * 
 * @route POST /api/tickets/purchase
 * @access Private (requires authentication)
 */
const purchaseTicket = async (req, res) => {
  try {
    const { event_id, voucher_code } = req.body;
    const user_id = req.user.id; // Dari authMiddleware

    // -------------------------------------------------------------------------
    // STEP 1: Validasi input
    // -------------------------------------------------------------------------
    if (!event_id) {
      return res.status(400).json({
        success: false,
        message: 'event_id harus diisi'
      });
    }

    // -------------------------------------------------------------------------
    // STEP 2: Validasi event exists (quick check)
    // -------------------------------------------------------------------------
    // Validasi ringan di sini, validasi lengkap di worker
    const event = await Event.findByPk(event_id, {
      attributes: ['id', 'nama', 'kuota'] // Only select minimal fields
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan'
      });
    }

    // Quick check kuota (tidak atomik, hanya untuk fast feedback)
    if (event.kuota <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Kuota tiket sudah habis'
      });
    }

    // -------------------------------------------------------------------------
    // STEP 3: Add job to queue
    // -------------------------------------------------------------------------
    const jobData = {
      user_id,
      event_id,
      voucher_code: voucher_code || null
    };

    // Add job dengan priority (opsional: bisa prioritize VIP users)
    const job = await addTicketPurchaseJob(jobData, {
      priority: req.user.role === 'admin' ? 1 : 5 // Admin priority higher
    });

    // -------------------------------------------------------------------------
    // STEP 4: Return immediate response dengan job ID
    // -------------------------------------------------------------------------
    // User mendapat response cepat tanpa menunggu processing selesai
    res.status(202).json({ // 202 = Accepted (processing)
      success: true,
      message: 'Pembelian tiket sedang diproses',
      data: {
        job_id: job.id,
        status: 'processing',
        event: {
          id: event.id,
          nama: event.nama
        },
        // Instruksi untuk frontend
        check_status_url: `/api/tickets/purchase-status/${job.id}`
      }
    });

  } catch (error) {
    console.error('Purchase ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses pembelian tiket'
    });
  }
};

// -----------------------------------------------------------------------------
// CHECK PURCHASE STATUS - untuk polling status job
// -----------------------------------------------------------------------------
/**
 * Endpoint untuk mengecek status pembelian tiket
 * Frontend harus polling endpoint ini untuk update status
 * 
 * @route GET /api/tickets/purchase-status/:jobId
 * @access Private (requires authentication)
 */
const checkPurchaseStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    // -------------------------------------------------------------------------
    // Get job status dari queue
    // -------------------------------------------------------------------------
    const jobStatus = await getJobStatus(jobId);

    if (jobStatus.status === 'not_found') {
      return res.status(404).json({
        success: false,
        message: 'Job tidak ditemukan',
        code: 'JOB_NOT_FOUND'
      });
    }

    // -------------------------------------------------------------------------
    // Map job status ke response yang user-friendly
    // -------------------------------------------------------------------------
    let response = {
      success: true,
      job_id: jobId,
      status: jobStatus.status,
      progress: jobStatus.progress || 0,
      attempts: jobStatus.attempts || 0
    };

    // Handle different job states
    switch (jobStatus.status) {
      case 'waiting':
      case 'delayed':
        response.message = 'Pembelian dalam antrian, mohon tunggu...';
        break;

      case 'active':
        response.message = `Sedang memproses... (${jobStatus.progress}%)`;
        break;

      case 'completed':
        response.message = 'Pembelian berhasil! Tiket sudah dikirim ke email Anda.';
        response.data = jobStatus.result; // Result dari worker
        break;

      case 'failed':
        response.success = false;
        response.message = 'Pembelian gagal: ' + (jobStatus.failedReason || 'Unknown error');
        response.code = 'PURCHASE_FAILED';

        // Jika kuota habis, beri kode khusus
        if (jobStatus.failedReason?.includes('habis')) {
          response.code = 'KUOTA_HABIS';
        }
        break;

      default:
        response.message = 'Status tidak diketahui';
    }

    res.json(response);

  } catch (error) {
    console.error('Check purchase status error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengecek status pembelian'
    });
  }
};

// -----------------------------------------------------------------------------
// VALIDATE TICKET - untuk scan QR code saat masuk event
// -----------------------------------------------------------------------------
/**
 * Endpoint untuk validasi tiket dengan QR code
 * Digunakan oleh admin untuk scan tiket saat user masuk event
 * 
 * @route GET /api/tickets/validate/:qrcode
 * @access Private (Admin only)
 */
const validateTicket = async (req, res) => {
  try {
    const { qrcode } = req.params;

    // -------------------------------------------------------------------------
    // Find ticket by QR code
    // -------------------------------------------------------------------------
    const ticket = await Ticket.findOne({
      where: { kode_qr: qrcode },
      include: [
        { model: Event },
        { model: User, attributes: ['id', 'nama', 'email'] }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Tiket tidak ditemukan',
        code: 'TICKET_NOT_FOUND'
      });
    }

    // -------------------------------------------------------------------------
    // Validate ticket status
    // -------------------------------------------------------------------------
    if (ticket.status === 'digunakan') {
      return res.status(400).json({
        success: false,
        message: 'Tiket sudah pernah digunakan',
        code: 'TICKET_ALREADY_USED',
        data: {
          used_at: ticket.updatedAt,
          ticket_info: {
            id: ticket.id,
            user: ticket.User.nama,
            event: ticket.Event.nama
          }
        }
      });
    }

    if (ticket.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Tiket sudah expired',
        code: 'TICKET_EXPIRED'
      });
    }

    // -------------------------------------------------------------------------
    // Mark ticket as used
    // -------------------------------------------------------------------------
    await ticket.update({ status: 'digunakan' });

    // -------------------------------------------------------------------------
    // Return success with ticket details
    // -------------------------------------------------------------------------
    res.json({
      success: true,
      message: 'Tiket valid! Silakan masuk.',
      code: 'TICKET_VALID',
      data: {
        ticket: {
          id: ticket.id,
          kode_qr: ticket.kode_qr,
          status: 'digunakan',
          waktu_beli: ticket.waktu_beli,
          validated_at: new Date()
        },
        user: {
          id: ticket.User.id,
          nama: ticket.User.nama,
          email: ticket.User.email
        },
        event: {
          id: ticket.Event.id,
          nama: ticket.Event.nama,
          lokasi: ticket.Event.lokasi,
          tanggal: ticket.Event.tanggal
        }
      }
    });

  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memvalidasi tiket'
    });
  }
};

// -----------------------------------------------------------------------------
// GET USER TICKETS - untuk melihat daftar tiket user
// -----------------------------------------------------------------------------
/**
 * Endpoint untuk melihat semua tiket yang dimiliki user
 * 
 * @route GET /api/tickets/my-tickets
 * @access Private
 */
const getMyTickets = async (req, res) => {
  try {
    const user_id = req.user.id;

    const tickets = await Ticket.findAll({
      where: { user_id },
      include: [
        { model: Event }
      ],
      order: [['waktu_beli', 'DESC']]
    });

    res.json({
      success: true,
      data: tickets
    });

  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data tiket'
    });
  }
};

// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------
module.exports = {
  purchaseTicket,
  checkPurchaseStatus,
  validateTicket,
  getMyTickets
};