document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  cargarPacientes(usuario.rol);

  document.getElementById("btnAgregar").addEventListener("click", () => {
    document.getElementById("formTitulo").textContent = "Nuevo Paciente";
    document.getElementById("formPaciente").reset();
    document.getElementById("id_paciente").value = "";
    document.getElementById("formPopup").showModal();
  });

  document.getElementById("btnCancelar").addEventListener("click", () => {
    document.getElementById("formPopup").close();
  });

  document.getElementById("volverDashboard").addEventListener("click", () => {
    window.electronAPI.navegar("dashboard.html");
  });
});

async function cargarPacientes(rol) {
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
        <td>
          <button onclick="editarPaciente(${p.id_paciente}, '${p.nombre_completo}', ${p.edad}, '${p.dni}', '${p.email}', '${p.sexo}')">Editar</button>
          <button class="btn-red" onclick="eliminarPaciente(${p.id_paciente})">Eliminar</button>
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
  document.getElementById("id_paciente").value = id;
  document.getElementById("nombre_completo").value = nombre_completo;
  document.getElementById("edad").value = edad;
  document.getElementById("dni").value = dni;
  document.getElementById("email").value = email;
  document.getElementById("sexo").value = sexo;
  document.getElementById("formPopup").showModal();
};

window.eliminarPaciente = async (id) => {
  if (!confirm("¿Eliminar este paciente?")) return;
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`http://localhost:3000/api/pacientes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error eliminando paciente");
    alert("Paciente eliminado correctamente");
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    cargarPacientes(usuario.rol);
  } catch (e) {
    alert("Error al eliminar paciente");
    console.error(e);
  }
};

document.getElementById("formPaciente").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const nombre_completo = document.getElementById("nombre_completo").value.trim();
  const edad = parseInt(document.getElementById("edad").value);
  const dni = document.getElementById("dni").value.trim();
  const email = document.getElementById("email").value.trim();
  const sexo = document.getElementById("sexo").value;
  const id = document.getElementById("id_paciente").value;

  if (!nombre_completo || !edad || !dni || !email || !sexo) {
    alert("Completa todos los campos");
    return;
  }

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
      body: JSON.stringify({ nombre_completo, edad, dni, email, sexo })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.mensaje || "Error guardando paciente");
    }

    alert("Paciente guardado correctamente");
    document.getElementById("formPopup").close();
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    cargarPacientes(usuario.rol);
  } catch (err) {
    alert("Error guardando paciente");
    console.error(err);
  }
});
