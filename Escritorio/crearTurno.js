const token = localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", async () => {
  await cargarPacientes();
  await cargarEspecialidades();

  document.getElementById("especialidad").addEventListener("change", cargarProfesionalesPorEspecialidad);
  document.getElementById("btnGuardarTurno").addEventListener("click", guardarTurno);
});

async function cargarPacientes() {
  const res = await fetch("/api/pacientes", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const pacientes = await res.json();

  const select = document.getElementById("paciente");
  pacientes.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id_paciente;
    option.textContent = p.nombre_completo;
    select.appendChild(option);
  });
}

async function cargarEspecialidades() {
  const res = await fetch("/api/especialidades", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const especialidades = await res.json();

  const select = document.getElementById("especialidad");
  especialidades.forEach(e => {
    const option = document.createElement("option");
    option.value = e.id_espe;
    option.textContent = e.nombre;
    select.appendChild(option);
  });

  await cargarProfesionalesPorEspecialidad(); // inicial
}

async function cargarProfesionalesPorEspecialidad() {
  const idEspecialidad = document.getElementById("especialidad").value;
  const res = await fetch(`/api/profesionales/especialidad/${idEspecialidad}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const profesionales = await res.json();

  const select = document.getElementById("profesional");
  select.innerHTML = "";
  profesionales.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id_profesional;
    option.textContent = p.nombre_completo;
    select.appendChild(option);
  });
}

async function guardarTurno() {
  const id_paciente = document.getElementById("paciente").value;
  const id_especialidad = document.getElementById("especialidad").value;
  const id_profesional = document.getElementById("profesional").value;
  const fecha_turno = document.getElementById("fechaHora").value;

  const res = await fetch("/api/turnos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id_paciente,
      id_especialidad,
      id_profesional,
      fecha_turno
    })
  });

  const mensajeDiv = document.getElementById("mensaje");
  if (res.ok) {
    mensajeDiv.textContent = "Turno guardado con éxito";
    mensajeDiv.style.color = "green";
  } else {
    const data = await res.json();
    mensajeDiv.textContent = "Error: " + data.mensaje;
    mensajeDiv.style.color = "red";
  }
}
