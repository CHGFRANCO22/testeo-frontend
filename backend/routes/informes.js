const express = require('express');
const router = express.Router();

async function consultarTurnosPorProfesional() {
  const fechaInicio = document.getElementById('fechaInicio').value;
  const fechaFin = document.getElementById('fechaFin').value;

  if (!fechaInicio || !fechaFin) {
    alert('Por favor, ingrese ambas fechas.');
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/informes/turnos-por-profesional?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error('Error al consultar el informe');
    const data = await res.json();

    const contenedor = document.getElementById('resultadoInforme1');
    if (data.length === 0) {
      contenedor.innerHTML = '<p>No hay datos para ese rango de fechas.</p>';
      return;
    }

    contenedor.innerHTML = '<ul>' + data.map(item =>
      `<li><strong>${item.profesional}</strong>: ${item.cantidad_turnos} turnos atendidos</li>`
    ).join('') + '</ul>';

  } catch (err) {
    console.error(err);
    alert('Error al cargar el informe.');
  }
}

async function consultarCanceladosReprogramados() {
  try {
    const res = await fetch(`http://localhost:3000/api/informes/turnos-cancelados-reprogramados`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error('Error al consultar el informe');
    const data = await res.json();

    const contenedor = document.getElementById('resultadoInforme2');
    if (data.length === 0) {
      contenedor.innerHTML = '<p>No hay turnos cancelados ni reprogramados.</p>';
      return;
    }

    contenedor.innerHTML = '<ul>' + data.map(item =>
      `<li><strong>${item.tipo}</strong>: ${item.cantidad}</li>`
    ).join('') + '</ul>';

  } catch (err) {
    console.error(err);
    alert('Error al cargar el informe.');
  }
}

async function consultarTurnosPorEspecialidad() {
  try {
    const res = await fetch(`http://localhost:3000/api/informes/turnos-por-especialidad`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error('Error al consultar el informe');
    const data = await res.json();

    const contenedor = document.getElementById('resultadoInforme3');
    if (data.length === 0) {
      contenedor.innerHTML = '<p>No hay datos de turnos por especialidad.</p>';
      return;
    }

    contenedor.innerHTML = '<ul>' + data.map(item =>
      `<li><strong>${item.especialidad}</strong>: ${item.cantidad_turnos} turnos</li>`
    ).join('') + '</ul>';

  } catch (err) {
    console.error(err);
    alert('Error al cargar el informe.');
  }
}

async function consultarTopPacientes() {
  try {
    const res = await fetch(`http://localhost:3000/api/informes/top-pacientes-mes`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error('Error al consultar el informe');
    const data = await res.json();

    const contenedor = document.getElementById('resultadoInforme4');
    if (data.length === 0) {
      contenedor.innerHTML = '<p>No hay pacientes con turnos este mes.</p>';
      return;
    }

    contenedor.innerHTML = '<ul>' + data.map(item =>
      `<li><strong>${item.nombre_completo}</strong>: ${item.cantidad_turnos} turnos este mes</li>`
    ).join('') + '</ul>';

  } catch (err) {
    console.error(err);
    alert('Error al cargar el informe.');
  }
}


module.exports = router;
