document.getElementById('guestCountInput').addEventListener('input', function () {
  const count = parseInt(this.value);
  const container = document.getElementById('guestsContainer');
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>Invitado ${i + 1}</h3>
      <input type="text" placeholder="Nombre completo" name="guestFullName${i}" required>
      <input type="number" placeholder="Promoción (80-99)" name="guestPromotion${i}" required>
      <select name="guestGender${i}" required>
        <option value="">Género</option>
        <option value="M">Masculino</option>
        <option value="F">Femenino</option>
        <option value="Otro">Otro</option>
      </select>
      <select name="guestDocType${i}" required>
        <option value="">Tipo de documento</option>
        <option value="DNI">DNI</option>
        <option value="CE">CE</option>
        <option value="Pasaporte">Pasaporte</option>
      </select>
      <input type="text" placeholder="Número de documento" name="guestDocNumber${i}" required>
      <hr>
    `;
    container.appendChild(div);
  }
});

document.getElementById('inscriptionForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;
  const guestCount = parseInt(form.guestCount.value);
  const email = form.email.value.trim();

  const guests = [];

  for (let i = 0; i < guestCount; i++) {
    guests.push({
      fullName: form[`guestFullName${i}`].value.trim(),
      promotion: form[`guestPromotion${i}`].value,
      gender: form[`guestGender${i}`].value,
      docType: form[`guestDocType${i}`].value,
      docNumber: form[`guestDocNumber${i}`].value.trim()
    });
  }

  const data = {
    email,
    guests
  };

  const res = await fetch('/api/register-inscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const json = await res.json();
  if (res.ok) {
    alert(`✅ Inscripción exitosa. Tu primer número de entrada es: ${json.entryNumber}`);
  } else {
    alert(json.message || '❌ Error al registrar');
  }
});
