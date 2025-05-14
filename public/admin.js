const params= new URLSearchParams(location.search),
      token = params.get('token'),
      userDiv = document.getElementById('user');

fetch(`/api/token-info?token=${token}`)
  .then(r=>r.json())
  .then(d=> userDiv.innerHTML=`
    <p><strong>Nombre:</strong> ${d.name}</p>
    <p><strong>Email:</strong> ${d.email}</p>
    <p><strong>Estado:</strong> ${d.status}</p>
  `);

function confirm(status) {
  fetch('/api/confirm-access',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ token, status })
  })
  .then(r=>r.json())
  .then(d=>alert(d.message))
  .catch(_=>alert('Error'));
}
