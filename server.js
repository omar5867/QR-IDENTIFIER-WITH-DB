require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const path = require('path');

const Inscription = require('./models/Inscription');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// QR como buffer
async function generateQRBuffer(data) {
  return await QRCode.toBuffer(data);
}

// Configurar email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Enviar correo
async function sendEmailWithQR(to, qrBuffer) {
  await transporter.sendMail({
    from: `"QR Seguro" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Tu código QR de acceso',
    html: `
      <p>Escanea este código QR al ingresar al evento:</p>
      <img src="cid:qrimage" alt="QR de acceso" width="200">
    `,
    attachments: [
      {
        filename: 'qr.png',
        content: qrBuffer,
        cid: 'qrimage'
      }
    ]
  });
}

// API registrar inscripción y enviar QR
app.post('/api/register-inscription', async (req, res) => {
  try {
    const { fullName, email, promotion, gender, documentType, documentNumber, guestCount } = req.body;

    if (!fullName || !email || !promotion || !gender || !documentType || !documentNumber || !guestCount)
      return res.status(400).json({ message: "Faltan datos" });

    const last = await Inscription.findOne().sort({ entryNumber: -1 });
    const nextEntryNumber = last ? last.entryNumber + 1 : 1;

    const token = uuidv4();
    const totalAmount = guestCount * 50;

    const guest = {
      fullName,
      promotion,
      gender,
      docType: documentType,
      docNumber: documentNumber
    };

    const newInscription = await Inscription.create({
      email,
      guests: [guest],
      entryNumber: nextEntryNumber,
      guestCount,
      totalAmount,
      token,
      used: false
    });

    const qrUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${token}`;
    const qrBuffer = await generateQRBuffer(qrUrl);

    await sendEmailWithQR(email, qrBuffer);

    res.json({
      message: 'Inscripción registrada y QR enviado',
      entryNumber: nextEntryNumber
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error interno" });
  }
});

// Página de verificación
app.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});

app.get('/verify/:token', async (req, res) => {
  const token = req.params.token;
  const doc = await Inscription.findOne({ token });

  if (!doc) return res.send("❌ QR inválido");
  if (doc.used) return res.send("⚠️ Este código ya fue utilizado");

  doc.used = true;
  await doc.save();

  const rep = doc.guests[0];
  res.send(`
    ✅ Acceso confirmado<br><br>
    <strong>Nombre:</strong> ${rep.fullName}<br>
    <strong>Promoción:</strong> ${rep.promotion}<br>
    <strong>Género:</strong> ${rep.gender}<br>
    <strong>Tipo de documento:</strong> ${rep.docType}<br>
    <strong>Número de documento:</strong> ${rep.docNumber}<br>
    <strong>Cantidad de invitados:</strong> ${doc.guestCount}
  `);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});