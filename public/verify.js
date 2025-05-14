const params = new URLSearchParams(location.search),
      token  = params.get('token'),
      out = document.getElementById('result');

if (!token) out.textContent = 'Falta token';
else {
  fetch(`/api/token-info?token=${token}`)
    .then(res=>res.json())
    .then(d=> out.innerHTML=`
      <p><strong>Nombre:</strong> ${d.name}</p>
      <p><strong>Email:</strong> ${d.email}</p>
      <p><strong>Estado:</strong> ${d.status}</p>
      <p><a href="/admin.html?token=${token}">Confirmar acceso</a></p>
    `)
    .catch(_=> out.textContent='Token inválido');
}
