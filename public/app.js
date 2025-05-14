document.getElementById('inscriptionForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;

  const data = {
    promotion: form.promotion.value,
    email: form.email.value.trim(),
    fullName: form.fullName.value.trim(),
    gender: form.gender.value,
    documentType: form.documentType.value.trim(),
    documentNumber: form.documentNumber.value.trim(),
    guestCount: parseInt(form.guestCount.value)
  };

  const res = await fetch('/api/register-inscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const json = await res.json();
  if (res.ok) {
    alert(`Inscripción exitosa. Tu número de entrada es: ${json.entryNumber}`);
  } else {
    alert(json.message || 'Error al registrar');
  }
});
