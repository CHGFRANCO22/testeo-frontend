document.addEventListener("DOMContentLoaded", async () => {
  const tabla = document.getElementById("tabla-turnos");
  const token = localStorage.getItem("token");

  if (!token) {
    tabla.innerHTML = "<tr><td colspan='4'>Debe iniciar sesión para ver sus turnos.</td></tr>";
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/turnos/mios", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Error al cargar los turnos.");

    const turnos = await response.json();
    tabla.innerHTML = "";

    if (turnos.length === 0) {
      tabla.innerHTML = "<tr><td colspan='4'>No tenés turnos agendados.</td></tr>";
      return;
    }

    turnos.forEach(turno => {
      const fecha = new Date(turno.fecha_turno);
      const fila = `
        <tr>
          <td>${turno.especialidad}</td>
          <td>${turno.profesional}</td>
          <td>${fecha.toLocaleDateString()}</td>
          <td>${fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
      `;
      tabla.innerHTML += fila;
    });
  } catch (error) {
    console.error("Error:", error);
    tabla.innerHTML = "<tr><td colspan='4'>Error al obtener los turnos.</td></tr>";
  }
});
