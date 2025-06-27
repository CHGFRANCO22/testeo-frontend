// turnos.js
const btnNuevo = document.getElementById('btnNuevo');
const dialog = document.getElementById('formPopup');
const btnCancelar = document.getElementById('btnCancelar');
const formTurno = document.getElementById('formTurno');

const selectPaciente = document.getElementById('paciente');
const selectEspecialidad = document.getElementById('especialidad');
const selectProfesional = document.getElementById('profesional');
const inputFecha = document.getElementById('fecha');
const inputHora = document.getElementById('hora');

const dialogRepro = document.getElementById('formReprogramar');
const formRepro = document.getElementById('formRepro');
const inputFechaRepro = document.getElementById('reproFecha');
const inputHoraRepro = document.getElementById('reproHora');
const inputIdRepro = document.getElementById('reproIdTurno');
const btnCerrarRepro = document.getElementById('btnCerrarRepro');

const tablaTurnosBody = document.querySelector('#tablaTurnos tbody');
const API_URL = 'http://localhost:3000/api';

btnNuevo.addEventListener('click', () => dialog.showModal());
btnCancelar.addEventListener('click', () => dialog.close());
btnCerrarRepro.addEventListener('click', () => dialogRepro.close());

inputFecha.min = new Date().toISOString().split('T')[0];

async function cargarSelects() {
  const respPacientes = await fetch(`${API_URL}/pacientes`, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  const pacientes = await respPacientes.json();
  selectPaciente.innerHTML = '<option value="">Seleccionar paciente</option>';
  pacientes.forEach(p => {
    selectPaciente.innerHTML += `<option value="${p.id_paciente}">${p.nombre_completo}</option>`;
  });

  const respEspecialidades = await fetch(`${API_URL}/especialidades`);
  const especialidades = await respEspecialidades.json();
  selectEspecialidad.innerHTML = '<option value="">Seleccionar especialidad</option>';
  especialidades.forEach(e => {
    selectEspecialidad.innerHTML += `<option value="${e.id_espe}">${e.nombre}</option>`;
  });

  selectProfesional.innerHTML = '<option value="">Seleccionar profesional</option>';
}

selectEspecialidad.addEventListener('change', async () => {
  const idEspecialidad = selectEspecialidad.value;
  if (!idEspecialidad) {
    selectProfesional.innerHTML = '<option value="">Seleccionar profesional</option>';
    return;
  }
  const respProfesionales = await fetch(`${API_URL}/profesionales/por-especialidad/${idEspecialidad}`);
  const profesionales = await respProfesionales.json();
  selectProfesional.innerHTML = '<option value="">Seleccionar profesional</option>';
  profesionales.forEach(prof => {
    selectProfesional.innerHTML += `<option value="${prof.id_profesional}">${prof.nombre_completo}</option>`;
  });
});

let turnos = [];

async function cargarTurnos() {
  const resp = await fetch(`${API_URL}/turnos`, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  turnos = await resp.json();

  tablaTurnosBody.innerHTML = '';
  turnos.forEach(t => {
    const fecha = new Date(t.fecha_turno);
    const fechaStr = fecha.toLocaleDateString();
    const horaStr = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const estadoDisplay = t.estado.charAt(0).toUpperCase() + t.estado.slice(1);

    const botonCancelar = t.estado === 'cancelado'
      ? '<button class="btn-red" disabled>Cancelado</button>'
      : `<button class="btn-red" data-id="${t.id}" data-accion="cancelar">Cancelar</button>`;

    const botonReprogramar = t.estado !== 'cancelado'
      ? `<button class="btn-blue" data-id="${t.id}" data-accion="reprogramar">Reprogramar</button>`
      : '';

    tablaTurnosBody.innerHTML += `
      <tr>
        <td>${t.paciente_nombre || 'Sin datos'}</td>
        <td>${t.profesional}</td>
        <td>${t.especialidad}</td>
        <td>${fechaStr}</td>
        <td>${horaStr}</td>
        <td>${botonCancelar} ${botonReprogramar}</td>
        <td>${estadoDisplay}</td>
      </tr>
    `;
  });

  document.querySelectorAll('button[data-accion="cancelar"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idTurno = e.target.dataset.id;
      if (confirm('¿Confirmás cancelar el turno?')) {
        const resp = await fetch(`${API_URL}/turnos/cancelar/${idTurno}`, {
          method: 'PUT',
          headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        });
        if (resp.ok) {
          alert('Turno cancelado');
          cargarTurnos();
        } else {
          alert('Error al cancelar el turno');
        }
      }
    });
  });

  document.querySelectorAll('button[data-accion="reprogramar"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idTurno = e.target.dataset.id;
      inputIdRepro.value = idTurno;
      inputFechaRepro.value = '';
      inputHoraRepro.innerHTML = '<option value="">Seleccionar horario</option>';
      dialogRepro.showModal();
    });
  });
}

formTurno.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id_paciente = selectPaciente.value;
  const id_especialidad = selectEspecialidad.value;
  const id_profesional = selectProfesional.value;
  const fecha = inputFecha.value;
  const hora = inputHora.value;

  if (!id_paciente || !id_especialidad || !id_profesional || !fecha || !hora) {
    alert('Completar todos los campos');
    return;
  }

  const fecha_turno = new Date(`${fecha}T${hora}`);
  if (isNaN(fecha_turno.getTime())) {
    alert('Fecha u hora inválida');
    return;
  }

  const body = {
    id_paciente,
    id_especialidad,
    id_profesional,
    fecha_turno: fecha_turno.toISOString()
  };

  const resp = await fetch(`${API_URL}/turnos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify(body)
  });

  if (resp.ok) {
    alert('Turno creado');
    dialog.close();
    cargarTurnos();
    formTurno.reset();
  } else {
    const errorData = await resp.json();
    alert('Error: ' + errorData.mensaje);
  }
});

// Reprogramar - al cambiar la fecha, cargar horarios
inputFechaRepro.addEventListener('change', async () => {
  const idTurno = inputIdRepro.value;
  const fecha = inputFechaRepro.value;
  if (!fecha) return;

  const turno = turnos.find(t => t.id == idTurno);
  if (!turno) return;

  const resp = await fetch(`${API_URL}/turnos/horarios-disponibles?profesional=${turno.id_profesional}&fecha=${fecha}`);
  const horarios = await resp.json();
  inputHoraRepro.innerHTML = '<option value="">Seleccionar horario</option>';
  horarios.forEach(h => {
    inputHoraRepro.innerHTML += `<option value="${h}">${h}</option>`;
  });
});

formRepro.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = inputIdRepro.value;
  const fecha = inputFechaRepro.value;
  const hora = inputHoraRepro.value;

  if (!fecha || !hora) {
    alert('Completar todos los campos');
    return;
  }

  const fecha_turno = new Date(`${fecha}T${hora}`).toISOString();

  const resp = await fetch(`${API_URL}/turnos/${id}/reprogramar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({ fecha_turno })
  });

  if (resp.ok) {
    alert('Turno reprogramado');
    dialogRepro.close();
    cargarTurnos();
  } else {
    const errorData = await resp.json();
    alert('Error: ' + errorData.mensaje);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  selectProfesional.addEventListener('change', cargarHorariosDisponibles);
  inputFecha.addEventListener('change', cargarHorariosDisponibles);
  cargarSelects();
  cargarTurnos();
  document.getElementById('volverDashboard').addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
});

async function cargarHorariosDisponibles() {
  const id_profesional = selectProfesional.value;
  const fecha = inputFecha.value;

  if (!id_profesional || !fecha) {
    inputHora.innerHTML = '<option value="">Seleccionar horario</option>';
    return;
  }

  try {
    const resp = await fetch(`${API_URL}/turnos/horarios-disponibles?profesional=${id_profesional}&fecha=${fecha}`);
    const horarios = await resp.json();

    inputHora.innerHTML = '<option value="">Seleccionar horario</option>';
    horarios.forEach(h => {
      inputHora.innerHTML += `<option value="${h}">${h}</option>`;
    });
  } catch (err) {
    console.error('Error al cargar horarios:', err);
    inputHora.innerHTML = '<option value="">Error al cargar</option>';
  }
}
const modalHistorial = document.getElementById('modalHistorial');
const tablaHistorial = document.getElementById('tablaHistorial');
const cerrarHistorial = document.getElementById('cerrarHistorial');

cerrarHistorial.addEventListener('click', () => modalHistorial.close());

// Botón historial por paciente en cada fila
function agregarHistorialPacienteBoton(idPaciente, celda) {
  const btn = document.createElement('button');
  btn.textContent = 'Historial';
  btn.addEventListener('click', async () => {
    try {
      const resp = await fetch(`${API_URL}/turnos/paciente/${idPaciente}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      const historial = await resp.json();
      tablaHistorial.innerHTML = '';
      historial.forEach(t => {
        const fecha = new Date(t.fecha_turno);
        const fechaStr = fecha.toLocaleDateString();
        const fila = `<tr>
          <td>${fechaStr}</td>
          <td>${t.profesional}</td>
          <td>${t.especialidad}</td>
        </tr>`;
        tablaHistorial.innerHTML += fila;
      });
      modalHistorial.showModal();
    } catch (error) {
      alert('Error al obtener historial');
    }
  });
  celda.appendChild(btn);
}

// Modifica cargarTurnos para agregar el botón de historial por paciente
// Luego de insertar la fila en tablaTurnosBody:
//   agregarHistorialPacienteBoton(t.id_paciente, celdaHistorial);
function agregarHistorialPacienteBoton(idPaciente, celda) {
  const btn = document.createElement('button');
  btn.textContent = 'Historial';
  btn.addEventListener('click', async () => {
    try {
      const resp = await fetch(`${API_URL}/turnos/paciente/${idPaciente}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      const historial = await resp.json();
      const tablaHistorialBody = document.querySelector('#tablaHistorial tbody');
      tablaHistorialBody.innerHTML = '';
      historial.forEach(t => {
        const fecha = new Date(t.fecha_turno).toLocaleDateString();
        const fila = `<tr>
          <td>${fecha}</td>
          <td>${t.profesional}</td>
          <td>${t.especialidad}</td>
        </tr>`;
      });
      document.getElementById('modalHistorial').showModal();
    } catch (error) {
      alert('Error al obtener historial');
    }
  });
  celda.appendChild(btn);
}
document.getElementById('cerrarHistorial').addEventListener('click', () => {
  document.getElementById('modalHistorial').close();
});
