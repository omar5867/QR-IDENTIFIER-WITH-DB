const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmailWithQR(to, qrBuffer) {
  await transporter.sendMail({
    from: `"QR App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Tu código QR de un solo uso',
    html: `
      <p>Escanea este QR (válido 5 minutos):</p>
      <img src="cid:qrimage" alt="QR de acceso" width="200">
    `,
    attachments: [
      {
        filename: 'qr.png',
        content: qrBuffer,
        cid: 'qrimage' // Este cid será usado como src en la imagen
      }
    ]
  });
}


module.exports = { sendEmailWithQR };
