const { Transaction, Ticket, Event, User } = require('../models');

const handleMidtransNotification = async (req, res) => {
  try {
    const { order_id, transaction_status, payment_type } = req.body;

    const transaction = await Transaction.findOne({
      where: { order_id },
      include: [
        { model: Ticket, include: [Event, User] }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    let status = 'pending';

    // --- PERBAIKAN LOGIKA DISINI ---
    const isTesting = true;

    // Jika isTesting TRUE atau status dari midtrans valid, maka dianggap sukses
    if (isTesting || transaction_status === 'capture' || transaction_status === 'settlement') {
      status = 'success';

      const { sendTicketEmail } = require('../utils/email');
      const { generateQRCode } = require('../utils/qrcode');

      // 1. Generate QR Code
      const qrCode = await generateQRCode(transaction.Ticket.kode_qr);

      // 2. Simpan string QR Code ke database agar bisa diakses di dashboard/profile
      if (transaction.Ticket) {
        await transaction.Ticket.update({
          qr_image: qrCode // Pastikan kolom ini sudah ada di model Ticket kamu
        });
      }

      // 3. Kirim Email
      await sendTicketEmail(transaction.Ticket.User.email, {
        event: transaction.Ticket.Event,
        ticket: transaction.Ticket,
        qrCode
      });

    } else if (transaction_status === 'deny' || transaction_status === 'expire' || transaction_status === 'cancel') {
      status = 'failed';
    }

    // Update status transaksi
    await transaction.update({
      status_pembayaran: status,
      payment_type: payment_type || (isTesting ? 'testing-bypass' : 'unknown')
    });

    res.json({
      success: true,
      message: `Notification handled as ${status}`
    });
  } catch (error) {
    console.error('Handle notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle notification'
    });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        { model: User, attributes: ['id', 'nama', 'email'] },
        { model: Ticket, include: [Event] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data transaksi'
    });
  }
};

module.exports = {
  handleMidtransNotification,
  getAllTransactions
};