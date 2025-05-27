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

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // Para leer datos de formularios

// Función para generar QR como buffer
async function generateQRBuffer(data) {
  return await QRCode.toBuffer(data);
}

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Envío del QR por correo
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

// API para registrar inscripción
app.post('/api/register-inscription', async (req, res) => {
  try {
    const { email, guests } = req.body;

    if (!email || !Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Calcular último número de entrada
    let lastEntryNumber = 0;
    const result = await Inscription.find({}, 'guests.entryNumber').lean();
    for (const insc of result) {
      for (const guest of insc.guests || []) {
        if (typeof guest.entryNumber === 'number' && guest.entryNumber > lastEntryNumber) {
          lastEntryNumber = guest.entryNumber;
        }
      }
    }

    let nextEntryNumber = lastEntryNumber + 1;
    const token = uuidv4();
    const totalAmount = guests.length * 50;

    const guestsWithEntry = guests.map(guest => ({
      ...guest,
      entryNumber: nextEntryNumber++
    }));

    const newInscription = await Inscription.create({
      email,
      guests: guestsWithEntry,
      guestCount: guestsWithEntry.length,
      totalAmount,
      token,
      used: false
    });

    const qrUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${token}`;
    const qrBuffer = await generateQRBuffer(qrUrl);
    await sendEmailWithQR(email, qrBuffer);

    res.json({
      message: 'Inscripción registrada y QR enviado',
      entryNumber: guestsWithEntry[0].entryNumber
    });

  } catch (e) {
    console.error("❌ Error al registrar inscripción:", e);
    res.status(500).json({ message: "Error interno" });
  }
});

// Página estática del escáner
app.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});

// Mostrar detalles del token (sin consumir)
app.get('/verify/:token', async (req, res) => {
  const { token } = req.params;
  const doc = await Inscription.findOne({ token });

  if (!doc) return res.send("❌ QR inválido");

  const guestListHtml = doc.guests.map(guest => `
    <li>
      <strong>${guest.fullName}</strong> - Promoción: ${guest.promotion} | Género: ${guest.gender} |
      Doc: ${guest.docType} ${guest.docNumber} |
      Nº Entrada: ${guest.entryNumber}
    </li>
  `).join("");

  res.send(`
    <h2>${doc.used ? "⚠️ Ya registrado anteriormente" : "✅ Datos encontrados, confirmar identidad abajo."}</h2>
    <p><strong>Email:</strong> ${doc.email}</p>
    <ul>${guestListHtml}</ul>
    ${doc.used ? '' : `
      <form method="POST" action="/consume/${doc.token}">
        <button type="submit">✅ Confirmar Ingreso</button>
      </form>
    `}
  `);
});

// Consumir el token (confirmar ingreso)
app.post('/consume/:token', async (req, res) => {
  const { token } = req.params;
  const doc = await Inscription.findOne({ token });

  if (!doc) return res.send("❌ Token inválido");
  if (doc.used) return res.send("⚠️ Este código ya fue utilizado");

  doc.used = true;
  await doc.save();

  res.send("✅ Ingreso confirmado correctamente.");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});