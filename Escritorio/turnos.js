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

const tablaTurnosBody = document.querySelector('#tablaTurnos tbody');

const API_URL = 'http://localhost:3000/api';

btnNuevo.addEventListener('click', () => {
  dialog.showModal();
});

btnCancelar.addEventListener('click', () => {
  dialog.close();
});

// Establecer fecha mínima en el input
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

async function cargarTurnos() {
  const resp = await fetch(`${API_URL}/turnos`, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  const turnos = await resp.json();

  tablaTurnosBody.innerHTML = '';
  turnos.forEach(t => {
    const fecha = new Date(t.fecha_turno);
    const fechaStr = fecha.toLocaleDateString();
    const horaStr = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    tablaTurnosBody.innerHTML += `
      <tr>
        <td>${t.paciente_nombre || 'Sin datos'}</td>
        <td>${t.profesional}</td>
        <td>${t.especialidad}</td>
        <td>${fechaStr}</td>
        <td>${horaStr}</td>
        <td>
          <button class="btn-red" data-id="${t.id}" data-accion="cancelar">Cancelar</button>
        </td>
      </tr>
    `;
  });

  document.querySelectorAll('button[data-accion="cancelar"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idTurno = e.target.dataset.id;
      if (confirm('¿Confirmás cancelar el turno?')) {
        const resp = await fetch(`${API_URL}/turnos/${idTurno}/cancelar`, {
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

window.addEventListener('DOMContentLoaded', () => {
  cargarSelects();
  cargarTurnos();
  document.getElementById('volverDashboard').addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
});
