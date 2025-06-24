// js/pacientes.js

async function listarPacientes(rol) {
  try {
    const res = await fetchConToken("http://localhost:3000/api/pacientes");
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
          ${rol === "admin" ? `<button class="btn-edit" data-id="${p.id_paciente}">Editar</button>
                              <button class="btn-delete" data-id="${p.id_paciente}">Eliminar</button>` : ""}
        </td>
      `;

      tbody.appendChild(tr);
    });

    if (rol === "admin") {
      habilitarEventosAdmin();
    }

  } catch (err) {
    mostrarError("No se pudieron cargar los pacientes.");
    console.error(err);
  }
}

function habilitarEventosAdmin() {
  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("¿Eliminar paciente?")) return;
      try {
        const res = await fetchConToken(`http://localhost:3000/api/pacientes/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error eliminando");
        alert("Paciente eliminado");
        window.listarPacientes(JSON.parse(localStorage.getItem("usuario")).rol);
      } catch (e) {
        mostrarError("Error eliminando paciente");
      }
    };
  });

  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.onclick = () => {
      abrirFormularioEdicion(btn.getAttribute("data-id"));
    };
  });
}

function abrirFormularioEdicion(id) {
  // Aquí puedes completar para cargar datos y mostrar el formulario edición
  alert(`Editar paciente con ID: ${id} (Funcionalidad por implementar)`);
}

// Manejo del formulario crear paciente
const formPaciente = document.getElementById("formularioPaciente");
const btnAgregarPaciente = document.getElementById("btnAgregarPaciente");
const btnCancelar = document.getElementById("btnCancelar");

btnAgregarPaciente.addEventListener("click", () => {
  formPaciente.classList.remove("hidden");
});

btnCancelar.addEventListener("click", () => {
  formPaciente.classList.add("hidden");
  formPaciente.reset();
});

formPaciente.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre_completo = document.getElementById("nombre_completo").value.trim();
  const edad = document.getElementById("edad").value.trim();
  const dni = document.getElementById("dni").value.trim();
  const email = document.getElementById("email").value.trim();
  const sexo = document.getElementById("sexo").value;

  if (!nombre_completo || !edad || !dni || !email || !sexo) {
    mostrarError("Completar todos los campos");
    return;
  }

  try {
    const res = await fetchConToken("http://localhost:3000/api/pacientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_completo, edad, dni, email, sexo }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.mensaje || "Error al guardar paciente");
    }

    alert("Paciente creado");
    formPaciente.reset();
    formPaciente.classList.add("hidden");
    window.listarPacientes(JSON.parse(localStorage.getItem("usuario")).rol);
  } catch (e) {
    mostrarError(e.message);
  }
});
