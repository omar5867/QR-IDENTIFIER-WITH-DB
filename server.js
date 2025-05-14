require('dotenv').config();
const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const bcrypt     = require('bcrypt');
const mongoose   = require('mongoose');
const basicAuth  = require('basic-auth');
const { v4: uuidv4 } = require('uuid');
const QRCode     = require('qrcode');
const nodemailer = require('nodemailer');

const UserQR = require('./models/UserQR');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error MongoDB:', err));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

function adminAuth(req, res, next) {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.ADMIN_USER || user.pass !== process.env.ADMIN_PASS) {
    res.set('WWW-Authenticate','Basic realm="Admin Area"');
    return res.status(401).send('Acceso restringido');
  }
  next();
}

// --- Nueva función: genera QR como Buffer (imagen PNG)
async function generateQRBuffer(data) {
  return await QRCode.toBuffer(data); // Buffer en formato PNG
}

// --- Nueva función: enviar correo con QR embebido
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
      <p>Escanea este código QR (válido 5 minutos):</p>
      <img src="cid:qrimage" alt="QR de acceso" width="200">
    `,
    attachments: [
      {
        filename: 'qr.png',
        content: qrBuffer,
        cid: 'qrimage' // Usado como src en HTML
      }
    ]
  });
}

// --- API: Generar QR
app.post('/api/generate-qr', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Faltan datos" });

    const passwordHash = await bcrypt.hash(password, 10);
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const qrData = `${baseUrl}/verify/${token}`;
    const qrBuffer = await generateQRBuffer(qrData);

    await UserQR.create({ name, email, passwordHash, token, expiresAt });

    await sendEmailWithQR(email, qrBuffer);
    res.json({ message: 'QR enviado por correo' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error interno" });
  }
});

// --- Verificación (pantalla de escaneo)
app.get('/verify', (req, res) => {
  res.sendFile(__dirname + '/public/verify.html');
});

app.get('/api/token-info', async (req, res) => {
  const { token } = req.query;
  const doc = await UserQR.findOne({ token });
  if (!doc) return res.status(404).json({ message: "No encontrado" });
  res.json({
    name: doc.name,
    email: doc.email,
    status: doc.status,
    used: doc.used,
    expiresAt: doc.expiresAt
  });
});

// --- Panel Admin
app.get('/admin.html', adminAuth, (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

app.post('/api/confirm-access', adminAuth, async (req, res) => {
  const { token, status } = req.body;
  if (!['aceptado', 'rechazado'].includes(status))
    return res.status(400).json({ message: "Estado inválido" });

  const doc = await UserQR.findOne({ token });
  if (!doc) return res.status(404).json({ message: "No encontrado" });

  if (Date.now() > doc.expiresAt) return res.status(410).json({ message: "Expirado" });

  if (doc.used) return res.status(403).json({ message: "Ya usado" });

  doc.status = status;
  doc.used = true;
  await doc.save();

  res.json({ message: `Acceso ${status}` });
});

// --- Acceso mediante escaneo del QR
app.get('/verify/:token', async (req, res) => {
  const token = req.params.token;
  const doc = await UserQR.findOne({ token });

  if (!doc) return res.send("❌ QR inválido");

  if (Date.now() > doc.expiresAt) return res.send("⏰ QR expirado");

  if (doc.used) return res.send("⚠️ Este código ya fue utilizado");

  // Marcar como usado
  doc.used = true;
  doc.status = "aceptado"; // O puedes dejarlo como "pendiente"
  await doc.save();

  res.send(`✅ Acceso confirmado para ${doc.name}`);
});

// --- Inicia servidor
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));