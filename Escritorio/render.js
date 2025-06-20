async function solicitarTurno() {
  const response = await window.api.fetchData('http://localhost:3000/api/turnos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pacienteId: 1, fecha: '2025-06-20', hora: '10:00' })
  });

  console.log('Respuesta del servidor:', response);
}
