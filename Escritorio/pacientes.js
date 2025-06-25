document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  cargarPacientes(usuario.rol);

  document.getElementById("volverDashboard").addEventListener("click", () => {
    window.electronAPI.navegar("dashboard.html");
  });

  document.getElementById("btnAgregar").addEventListener("click", () => {
    document.getElementById("formTitulo").textContent = "Nuevo Paciente";
    document.getElementById("formulario").style.display = "block";
    document.getElementById("formPaciente").reset();
    document.getElementById("id_paciente").value = "";
  });

  document.getElementById("btnCancelar").addEventListener("click", () => {
    document.getElementById("formulario").style.display = "none";
  });

  document.getElementById("formPaciente").addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const datos = {
      nombre_completo: document.getElementById("nombre_completo").value.trim(),
      edad: parseInt(document.getElementById("edad").value),
      dni: document.getElementById("dni").value.trim(),
      email: document.getElementById("email").value.trim(),
      sexo: document.getElementById("sexo").value
    };

    const id = document.getElementById("id_paciente").value;
    const metodo = id ? "PUT" : "POST";
    const url = id
      ? `http://localhost:3000/api/pacientes/${id}`
      : "http://localhost:3000/api/pacientes";

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datos)
      });

      if (!res.ok) throw new Error("Error al guardar");

      alert("Paciente guardado");
      document.getElementById("formulario").style.display = "none";
      cargarPacientes(usuario.rol);
    } catch (err) {
      alert("Error al guardar paciente");
      console.error(err);
    }
  });
});

async function cargarPacientes(rol) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/api/pacientes", {
      headers: { Authorization: `Bearer ${token}` }
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
        <td class="acciones">
          ${rol === "admin"
            ? `<button onclick="editarPaciente(${p.id_paciente}, '${p.nombre_completo}', ${p.edad}, '${p.dni}', '${p.email}', '${p.sexo}')">Editar</button>
               <button onclick="eliminarPaciente(${p.id_paciente})">Eliminar</button>`
            : "-"}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    alert("Error cargando pacientes");
    console.error(e);
  }
}

window.editarPaciente = (id, nombre_completo, edad, dni, email, sexo) => {
  document.getElementById("formTitulo").textContent = "Editar Paciente";
  document.getElementById("formulario").style.display = "block";
  document.getElementById("id_paciente").value = id;
  document.getElementById("nombre_completo").value = nombre_completo;
  document.getElementById("edad").value = edad;
  document.getElementById("dni").value = dni;
  document.getElementById("email").value = email;
  document.getElementById("sexo").value = sexo;
};

window.eliminarPaciente = async (id) => {
  if (!confirm("¿Eliminar paciente?")) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3000/api/pacientes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Error eliminando");

    alert("Paciente eliminado");
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    cargarPacientes(usuario.rol);
  } catch (e) {
    alert("Error al eliminar paciente");
    console.error(e);
  }
};
