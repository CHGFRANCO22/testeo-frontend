// turnos.js
const token = localStorage.getItem("token");
const dialog = document.getElementById("dialogNuevoTurno");
const btnNuevoTurno = document.getElementById("btnNuevoTurno");
const btnCancelar = document.getElementById("btnCancelar");
const form = document.getElementById("formNuevoTurno");
const especialidadSelect = document.getElementById("especialidad");
const profesionalSelect = document.getElementById("profesional");
const pacienteSelect = document.getElementById("paciente");
const fechaHoraInput = document.getElementById("fechaHora");

// Redirigir al dashboard
const volverDashboard = document.getElementById("volverDashboard");
volverDashboard.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

// Mostrar diálogo
btnNuevoTurno.addEventListener("click", () => {
  dialog.showModal();
});

// Cerrar diálogo
btnCancelar.addEventListener("click", () => {
  dialog.close();
});

// Cargar especialidades
async function cargarEspecialidades() {
  const res = await fetch("http://localhost:3000/api/especialidades", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const especialidades = await res.json();
  especialidades.forEach((esp) => {
    const option = document.createElement("option");
    option.value = esp.id_espe;
    option.textContent = esp.nombre;
    especialidadSelect.appendChild(option);
  });
}

// Cargar pacientes
async function cargarPacientes() {
  const res = await fetch("http://localhost:3000/api/pacientes", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const pacientes = await res.json();
  pacientes.forEach((pac) => {
    const option = document.createElement("option");
    option.value = pac.id_paciente;
    option.textContent = pac.nombre_completo;
    pacienteSelect.appendChild(option);
  });
}

// Cargar profesionales al seleccionar especialidad
especialidadSelect.addEventListener("change", async () => {
  profesionalSelect.innerHTML = '<option value="">Seleccionar profesional</option>';
  const idEspecialidad = especialidadSelect.value;
  if (!idEspecialidad) return;

  const res = await fetch(`http://localhost:3000/api/profesionales/por-especialidad/${idEspecialidad}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const profesionales = await res.json();
  profesionales.forEach((pro) => {
    const option = document.createElement("option");
    option.value = pro.id_profesional;
    option.textContent = pro.nombre_completo;
    profesionalSelect.appendChild(option);
  });
});

// Enviar formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    id_profesional: profesionalSelect.value,
    id_especialidad: especialidadSelect.value,
    fecha_turno: fechaHoraInput.value,
    id_paciente: pacienteSelect.value,
  };

  const res = await fetch("http://localhost:3000/api/turnos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (res.ok) {
    alert("Turno creado correctamente");
    dialog.close();
    location.reload();
  } else {
    alert(result.mensaje || "Error al crear turno");
  }
});

// Inicializar
cargarEspecialidades();
cargarPacientes();
