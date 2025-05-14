const nameEl = document.getElementById('name');
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const qrResult = document.getElementById('qrResult');


document.getElementById('qrForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = nameEl.value.trim(),
        email= emailEl.value.trim(),
        password = passwordEl.value;
  const res = await fetch('/api/generate-qr',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (res.ok) {
    qrResult.innerHTML = `<img src="${data.qrUrl}" alt="QR">`;
    alert('QR enviado por correo');
  } else alert(data.message);
});
