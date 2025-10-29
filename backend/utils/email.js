const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendTicketEmail = async (to, ticketData) => {
  try {
    const { event, ticket, qrCode } = ticketData;

    const mailOptions = {
      from: `BBO Event <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Pembelian Tiket Konser Berhasil!',
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #FDB913 0%, #F37021 50%, #C1272D 100%); padding: 20px; border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #C1272D; text-align: center;">Tiket Berhasil Dibeli!</h1>
            <hr style="border: 2px solid #FDB913; margin: 20px 0;">
            
            <h2 style="color: #F37021;">Detail Event:</h2>
            <p><strong>Nama Event:</strong> ${event.nama}</p>
            <p><strong>Lokasi:</strong> ${event.lokasi}</p>
            <p><strong>Tanggal:</strong> ${new Date(event.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Harga:</strong> Rp ${parseFloat(ticket.total_harga).toLocaleString('id-ID')}</p>
            
            <hr style="border: 1px solid #FDB913; margin: 20px 0;">
            
            <h2 style="color: #F37021;">Kode Tiket Anda:</h2>
            <div style="text-align: center; margin: 20px 0;">
              <img src="${qrCode}" alt="QR Code" style="max-width: 200px;">
              <p style="font-size: 12px; color: #666; margin-top: 10px;">Kode QR: ${ticket.kode_qr}</p>
            </div>
            
            <div style="background: #FFF3CD; padding: 15px; border-radius: 5px; border-left: 4px solid #FDB913;">
              <p style="margin: 0; color: #856404;"><strong>Catatan:</strong> Tunjukkan QR code ini saat masuk ke venue.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">Terima kasih telah menggunakan BBO Event!</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

module.exports = { sendTicketEmail };