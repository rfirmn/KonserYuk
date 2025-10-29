const { Ticket, Event, User, Transaction, Voucher } = require('../models');
const { generateQRCode } = require('../utils/qrcode');
const { sendTicketEmail } = require('../utils/email');
const { createMidtransTransaction } = require('../utils/midtrans');
const { v4: uuidv4 } = require('uuid');

const purchaseTicket = async (req, res) => {
  try {
    const { event_id, voucher_code } = req.body;
    const user_id = req.user.id;

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

    let total_harga = parseFloat(event.harga);
    
    if (voucher_code) {
      const voucher = await Voucher.findOne({ where: { kode: voucher_code } });
      
      if (voucher) {
        const now = new Date();
        if (now >= voucher.aktif_dari && now <= voucher.aktif_sampai) {
          const diskon = (total_harga * parseFloat(voucher.diskon)) / 100;
          total_harga -= diskon;
        }
      }
    }

    const kode_qr = uuidv4();
    const qrCodeDataURL = await generateQRCode(kode_qr);

    const ticket = await Ticket.create({
      user_id,
      event_id,
      kode_qr,
      total_harga,
      status: 'aktif',
      waktu_beli: new Date()
    });

    const order_id = `ORDER-${Date.now()}-${ticket.id}`;
    const midtransResponse = await createMidtransTransaction({
      order_id,
      gross_amount: total_harga,
      customer_details: {
        first_name: req.user.nama,
        email: req.user.email
      }
    });

    await Transaction.create({
      user_id,
      ticket_id: ticket.id,
      order_id,
      status_pembayaran: 'pending'
    });

    await event.update({ kuota: event.kuota - 1 });

    res.status(201).json({
      success: true,
      message: 'Tiket berhasil dibuat. Silakan lakukan pembayaran.',
      data: {
        ticket,
        payment: midtransResponse,
        qr_code: qrCodeDataURL
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

    if (ticket.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Tiket sudah expired'
      });
    }

    await ticket.update({ status: 'digunakan' });

    res.json({
      success: true,
      message: 'Tiket valid',
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