document.addEventListener("DOMContentLoaded", async () => {
  const tabla = document.getElementById("tabla-turnos");
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!token || !usuario || !usuario.id) {
    tabla.innerHTML = "<tr><td colspan='4'>Debe iniciar sesión para ver sus turnos.</td></tr>";
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/turnos/mis-turnos/${usuario.id}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Error al cargar los turnos.");
    }

    const turnos = await response.json();
    tabla.innerHTML = "";

    if (turnos.length === 0) {
      tabla.innerHTML = "<tr><td colspan='4'>No tenés turnos agendados.</td></tr>";
      return;
    }

    turnos.forEach(turno => {
      const fila = `
        <tr>
          <td>${turno.nombre_especialidad}</td>
          <td>${turno.nombre_profesional}</td>
          <td>${new Date(turno.fecha_turno).toLocaleDateString()}</td>
          <td>${new Date(turno.fecha_turno).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
        </tr>
      `;
      tabla.innerHTML += fila;
    });
  } catch (error) {
    console.error("Error:", error);
    tabla.innerHTML = "<tr><td colspan='4'>Error al obtener los turnos.</td></tr>";
  }
});
