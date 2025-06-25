document.addEventListener("DOMContentLoaded", () => {
  // Cargar pacientes al iniciar
  cargarPacientes();

  // Manejar clic en título para volver al dashboard
  const volver = document.getElementById("volverDashboard");
  if (volver) {
    volver.addEventListener("click", () => {
      window.electronAPI.navegar("dashboard.html");
    });
  }

  // (Opcional) cerrar sesión si hay botón
  const btnCerrarSesion = document.getElementById("cerrarSesion");
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", () => {
      localStorage.clear();
      window.electronAPI.logout();
    });
  }
});

async function cargarPacientes() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/api/pacientes", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Error cargando pacientes");

    const pacientes = await res.json();
    const tbody = document.querySelector("#tablaPacientes tbody");
    tbody.innerHTML = "";

    pacientes.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.nombre_completo}</td>
        <td>${p.edad}</td>
        <td>${p.dni}</td>
        <td>${p.email}</td>
        <td>${p.sexo}</td>
        <td>-</td> <!-- Acciones futuras: editar/eliminar -->
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    alert("Error cargando pacientes");
    console.error(e);
  }
}
