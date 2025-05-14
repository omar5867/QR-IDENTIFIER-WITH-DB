const QRCode = require('qrcode');

async function generateQRBuffer(data) {
  return await QRCode.toBuffer(data); // Devuelve Buffer PNG
}

module.exports = { generateQRBuffer };
