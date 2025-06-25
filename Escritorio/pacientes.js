document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("cerrarSesion").addEventListener("click", () => {
    localStorage.clear();
    window.electronAPI.logout();
  });

  cargarPacientes();
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
        <td>-</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    alert("Error cargando pacientes");
    console.error(e);
  }
}
