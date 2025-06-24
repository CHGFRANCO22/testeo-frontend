// modules/pacientes.js
import { fetchConToken } from './modules/sesion.js'; // Asegurate de tener esta función
import { mostrarError } from './modules/layout.js';  // Si ya la tenés, sino la creamos
const token = localStorage.getItem("token");

let pacientesVisibles = false;

export function setupPacientes() {
  window.toggleFormulario = function () {
    const form = document.getElementById("formularioPaciente");
    const listado = document.getElementById("pacientesResultado");

    if (pacientesVisibles) {
      listado.innerHTML = '';
      pacientesVisibles = false;
    }

    form.style.display = form.style.display === "none" ? "block" : "none";

    if (form.style.display === "block") {
      cargarPacientesParaTurno();
    }
  };

  window.enviarFormularioPaciente = async function () {
    const nombre_completo = document.getElementById("nombre_completo").value.trim();
    const dni = document.getElementById("dni").value.trim();
    const sexo = document.getElementById("sexo").value.trim();
    const edad = document.getElementById("edad").value.trim();
    const email = document.getElementById("email").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();
    const repetir_contrasena = document.getElementById("repetir_contrasena").value.trim();

    if (!nombre_completo || !dni || !sexo || !edad || !email || !contrasena || !repetir_contrasena) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      alert("Email inválido.");
      return;
    }

    if (contrasena !== repetir_contrasena) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    const tieneMayuscula = /[A-Z]/.test(contrasena);
    const tieneNumero = /[0-9]/.test(contrasena);
    const longitudValida = contrasena.length >= 6;

    if (!tieneMayuscula || !tieneNumero || !longitudValida) {
      alert("La contraseña debe tener al menos 6 caracteres, una mayúscula y un número.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/pacientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre_completo, dni, sexo, edad, email, contrasena }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Paciente registrado correctamente");
        document.getElementById("formularioPaciente").style.display = "none";
        listarPacientes();
      } else {
        alert(data.mensaje || "Error al registrar paciente");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Ocurrió un error al registrar el paciente.");
    }
  };

  window.listarPacientes = async function () {
    const container = document.getElementById("pacientesResultado");
    const formulario = document.getElementById("formularioPaciente");

    if (pacientesVisibles) {
      container.innerHTML = '';
      pacientesVisibles = false;
      return;
    }

    formulario.style.display = "none";

    try {
      const res = await fetch("http://localhost:3000/api/pacientes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pacientes = await res.json();

      container.innerHTML = '';
      pacientes.forEach(p => {
        const pacienteDiv = document.createElement('div');
        pacienteDiv.className = 'paciente-box';
        pacienteDiv.dataset.id = p.id_paciente;

        pacienteDiv.innerHTML = `
          <strong>${p.nombre_completo}</strong> - DNI: ${p.dni} - Edad: ${p.edad}
          <br><small>Email: ${p.email}</small>
          <div class="acciones">
            <button class="btn-historial">Historial</button>
            <button class="btn-eliminar" style="background:#e74c3c;">Eliminar</button>
          </div>
          <div class="historial-turnos"></div>
        `;

        container.appendChild(pacienteDiv);
      });

      pacientesVisibles = true;

      document.querySelectorAll('.btn-historial').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const pacienteDiv = e.target.closest('.paciente-box');
          const historialDiv = pacienteDiv.querySelector('.historial-turnos');

          if (historialDiv.style.display === 'block') {
            historialDiv.style.display = 'none';
            historialDiv.innerHTML = '';
            return;
          }

          const idPaciente = pacienteDiv.dataset.id;

          try {
            const res = await fetch(`http://localhost:3000/api/turnos/paciente/${idPaciente}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const turnos = await res.json();

            historialDiv.innerHTML = turnos.length > 0
              ? turnos.map(t =>
                  `<p>🗓️ <strong>${new Date(t.fecha_turno).toLocaleString()}</strong> - ${t.especialidad} con ${t.profesional}</p>`
                ).join('')
              : '<p>No hay turnos registrados para este paciente.</p>';

            historialDiv.style.display = 'block';
          } catch (err) {
            historialDiv.innerHTML = '<p>Error al cargar historial.</p>';
            historialDiv.style.display = 'block';
          }
        });
      });

      document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const pacienteDiv = e.target.closest('.paciente-box');
          const idPaciente = pacienteDiv.dataset.id;

          const confirmDelete = confirm('¿Estás seguro que quieres eliminar este paciente?');
          if (!confirmDelete) return;

          try {
            const res = await fetch(`http://localhost:3000/api/pacientes/${idPaciente}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
              pacienteDiv.remove();
            } else {
              alert('Error al eliminar paciente');
            }
          } catch (err) {
            alert('Error al eliminar paciente');
            console.error(err);
          }
        });
      });

    } catch (err) {
      console.error("Error al listar pacientes:", err);
    }
  }
}

async function cargarPacientesParaTurno() {
  const selectPaciente = document.getElementById("selectPaciente");
  if (!selectPaciente) return;

  selectPaciente.innerHTML = "<option>Cargando pacientes...</option>";

  try {
    const res = await fetch("http://localhost:3000/api/pacientes", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const pacientes = await res.json();

    selectPaciente.innerHTML = `<option value="">Seleccione paciente</option>`;
    pacientes.forEach(p => {
      const option = document.createElement("option");
      option.value = p.id_paciente;
      option.textContent = `${p.nombre_completo} - DNI: ${p.dni}`;
      selectPaciente.appendChild(option);
    });
  } catch (err) {
    console.error("Error al cargar pacientes:", err);
    selectPaciente.innerHTML = `<option>Error al cargar pacientes</option>`;
  }
}
