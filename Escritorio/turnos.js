// turnos.js

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!token || !usuario) {
    window.location.href = "login.html";
    return;
  }

  // Redirigir al Dashboard
  document.getElementById("volverDashboard").addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });

  // Redirigir a la creación de turno
  document.getElementById("btnNuevo").addEventListener("click", () => {
    window.location.href = "crearTurno.html";
  });

  // Función para cargar turnos desde la API
  async function cargarTurnos() {
    try {
      const response = await fetch("http://localhost:3000/api/turnos", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Error al obtener los turnos");

      const turnos = await response.json();
      mostrarTurnos(turnos);
    } catch (error) {
      console.error("Error al cargar turnos:", error);
    }
  }

  // Función para insertar los turnos en la tabla
  function mostrarTurnos(turnos) {
    const tbody = document.querySelector("#tablaTurnos tbody");
    tbody.innerHTML = "";

    if (!turnos.length) {
      tbody.innerHTML = "<tr><td colspan='6'>No hay turnos disponibles.</td></tr>";
      return;
    }

    turnos.forEach(turno => {
      const tr = document.createElement("tr");
      const fecha = new Date(turno.fecha_turno);

      tr.innerHTML = `
        <td>${turno.nombre_paciente || 'Sin nombre'}</td>
        <td>${turno.nombre_profesional || 'Sin nombre'}</td>
        <td>${turno.nombre_especialidad || 'Sin especialidad'}</td>
        <td>${fecha.toLocaleDateString()}</td>
        <td>${fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td>
          <button class="btn-red" data-id="${turno.id}">Cancelar</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Botones de cancelar
    document.querySelectorAll(".btn-red").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("¿Deseás cancelar este turno?")) {
          try {
            const res = await fetch(`http://localhost:3000/api/turnos/${id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            if (!res.ok) throw new Error("No se pudo cancelar el turno.");
            cargarTurnos(); // Recargar turnos
          } catch (err) {
            alert("Error al cancelar turno");
          }
        }
      });
    });
  }

  // Llamar a cargar turnos al iniciar
  cargarTurnos();
});
