const { Ticket, Event, User, Transaction, Voucher } = require('../models');
const { generateQRCode } = require('../utils/qrcode');
const { sendTicketEmail } = require('../utils/email');
const { createMidtransTransaction } = require('../utils/midtrans'); // Import tetap ada (sesuai request config), tapi tidak dipakai
const { v4: uuidv4 } = require('uuid');

const purchaseTicket = async (req, res) => {
  try {
    const { event_id, voucher_code } = req.body;
    const user_id = req.user.id; // Pastikan middleware auth sudah jalan

    // 1. Validasi Event
    const event = await Event.findByPk(event_id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan'
      });
    }

    if (event.kuota <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Kuota tiket habis'
      });
    }

    // 2. Hitung Harga & Diskon (Logika Nominal)
    let total_harga = parseFloat(event.harga);

    if (voucher_code) {
      const voucher = await Voucher.findOne({ where: { kode: voucher_code } });

      if (voucher) {
        const now = new Date();
        if (now >= voucher.aktif_dari && now <= voucher.aktif_sampai) {
          // Asumsi diskon adalah nominal (Rupiah), bukan persen
          total_harga -= total_harga * (voucher.diskon / 100);

          // Validasi agar harga tidak minus
          if (total_harga < 0) {
            total_harga = 0;
          }
        }
      }
    }

    // 3. Generate QR Code & Data Pendukung
    const kode_qr = uuidv4();
    const qrCodeDataURL = await generateQRCode(kode_qr); // Generate gambar QR Base64
    const order_id = `ORDER-${Date.now()}-${uuidv4()}`; // Order ID unik

    // 4. Create Ticket (Langsung Simpan QR Image ke DB)
    const ticket = await Ticket.create({
      user_id,
      event_id,
      kode_qr,
      qr_image: qrCodeDataURL, // <--- PENTING: Simpan gambar QR ke database
      total_harga,
      status: 'aktif', // Langsung aktif karena bypass
      waktu_beli: new Date()
    });

    // 5. Create Transaction (BYPASS LOGIC: Langsung Success)
    /* CODE LAMA (MIDTRANS) - DIKOMENTARI UNTUK BYPASS:
       const midtransResponse = await createMidtransTransaction({ ... }); 
    */

    await Transaction.create({
      user_id,
      ticket_id: ticket.id,
      order_id,
      total_bayar: total_harga,
      status_pembayaran: 'success',
      payment_type: 'bypass_manual'
    });

    // 6. Update Kuota Event
    await event.update({ kuota: event.kuota - 1 });

    // const qrCodeImage = await QRCode.toDataURL(savedTicket.kode_qr);

    // 7. Kirim Email Tiket (Langsung dikirim karena sudah sukses)
    try {
      await sendTicketEmail(req.user.email, {
        event: event,
        ticket: ticket,
        qrCode: qrCodeDataURL
      });
    } catch (emailError) {
      console.error("Gagal kirim email, tapi transaksi tetap sukses:", emailError);
    }

    // 8. Response ke Frontend
    res.status(201).json({
      success: true,
      message: 'Tiket berhasil dibeli (Mode Testing/Bypass).',
      data: {
        ticket,
        qr_code: qrCodeDataURL,
        transaction_status: 'success'
      }
    });

  } catch (error) {
    console.error('Purchase ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membeli tiket'
    });
  }
};

const validateTicket = async (req, res) => {
  try {
    const { qrcode } = req.params;

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
        message: 'Tiket tidak ditemukan'
      });
    }

    if (ticket.status === 'digunakan') {
      return res.status(400).json({
        success: false,
        message: 'Tiket sudah digunakan'
      });
    }

    await ticket.update({ status: 'digunakan' });

    res.json({
      success: true,
      message: 'Tiket valid! Silakan masuk.',
      data: ticket
    });
  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memvalidasi tiket'
    });
  }
};

module.exports = {
  purchaseTicket,
  validateTicket
};