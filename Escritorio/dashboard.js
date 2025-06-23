 const token = localStorage.getItem("token");
document.addEventListener('DOMContentLoaded', () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!token || !usuario) {
    window.location.href = "login.html";
  }

  // Mostrar/Ocultar menús según rol
  if (usuario.rol === "secretaria") {
    document.getElementById("pacientes")?.remove();
    document.getElementById("perfil")?.remove();
    const menu = document.getElementById("menuList");
    menu.querySelector("li[onclick=\"showSection('pacientes')\"]")?.remove();
    menu.querySelector("li[onclick=\"showSection('perfil')\"]")?.remove();
  }

  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggle-btn');
  const content = document.getElementById('content');
  const sections = document.querySelectorAll('.section');
  const menuItems = document.querySelectorAll('#menuList li');

  toggleBtn.onclick = () => {
    sidebar.classList.toggle('hide');
    content.classList.toggle('fullwidth');
  };

  function showSection(sectionId) {
    if (sectionId === 'turnos') {
      cargarFiltrosTurnos();
      listarTurnos;
    }
    sections.forEach(s => {
      s.style.display = s.id === sectionId ? 'block' : 'none';
    });
    menuItems.forEach(li => {
      li.classList.toggle('active', li.getAttribute('onclick').includes(sectionId));
    });
  }

  window.showSection = showSection;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.electronAPI.logout();
  });

  // === Pacientes ===
  let pacientesVisibles = false;

  window.toggleFormulario = function() {
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

  async function cargarPacientesParaTurno() {
  const selectPaciente = document.getElementById("selectPaciente");
  if (!selectPaciente) return; // Solo si existe el select

  selectPaciente.innerHTML = "<option>Cargando pacientes...</option>";

  try {
    const res = await fetch("http://localhost:3000/api/pacientes", {
      headers: {
        Authorization: `Bearer ${token}`,  // token válido y con rol correcto
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
      throw new Error(`Error al listar pacientes: ${res.status}`);
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


  window.enviarFormularioPaciente = async function() {
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

  async function listarPacientes() {
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

  window.listarPacientes = listarPacientes;

  // === Turnos ===
  let turnosVisibles = false;
  let turnoReprogramando = null;

  window.nuevoTurno = function() {
    showSection('turnos');
    cargarEspecialidades();
    document.getElementById('formularioTurno').style.display = 'block';
  };

  window.toggleFormularioTurno = function() {
    const form = document.getElementById("formularioTurno");
    const listado = document.getElementById("turnosResultado");

    if (turnosVisibles) {
      listado.innerHTML = "";
      turnosVisibles = false;
    }

    form.style.display = form.style.display === "none" ? "block" : "none";
    if (form.style.display === "block") {
      cargarPacientesParaTurno();
    }
  };

  async function cargarEspecialidades() {
    const selectEsp = document.getElementById("selectEspecialidad");
    selectEsp.innerHTML = "<option>Cargando especialidades...</option>";

    try {
      const res = await fetch("http://localhost:3000/api/especialidades", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Error al cargar especialidades");

      const especialidades = await res.json();

      selectEsp.innerHTML = '<option value="">Seleccione especialidad</option>';
      especialidades.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e.id_espe;
        opt.textContent = e.nombre;
        selectEsp.appendChild(opt);
      });

      selectEsp.onchange = async () => {
        const idEspecialidad = selectEsp.value;
        const selectProf = document.getElementById("selectProfesional");

        selectProf.innerHTML = "<option>Cargando profesionales...</option>";

        try {
          const res = await fetch(`http://localhost:3000/api/profesionales/por-especialidad/${idEspecialidad}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const profesionales = await res.json();

          selectProf.innerHTML = '<option value="">Seleccione profesional</option>';
          profesionales.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id_profesional;
            opt.textContent = p.nombre_completo;
            selectProf.appendChild(opt);
          });
        } catch (err) {
          selectProf.innerHTML = "<option>Error al cargar profesionales</option>";
        }
      };

    } catch (err) {
      selectEsp.innerHTML = "<option>Error al cargar especialidades</option>";
    }
  }

  window.enviarFormularioTurno = async function() {
    const id_paciente = document.getElementById("selectPaciente").value;
    const id_especialidad = document.getElementById("selectEspecialidad").value;
    const id_profesional = document.getElementById("selectProfesional").value;
    const fecha_turno = document.getElementById("fechaTurno").value;

    if (!id_paciente || !id_especialidad || !id_profesional || !fecha_turno) {
      alert("Por favor complete todos los campos del turno.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/turnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id_paciente, id_especialidad, id_profesional, fecha_turno })
      });

      const data = await res.json();
       console.log("Respuesta del backend:", data);

        if (!res.ok) {
      alert(data.mensaje || "Error al registrar turno");
      return; // 👈 IMPORTANTE: cortar la ejecución acá
    }
     alert("Turno registrado correctamente");
      document.getElementById("formularioTurno").reset();
      document.getElementById("formularioTurno").style.display = "none";
      listarTurnos();
    } catch (err) {
    console.error("Error al registrar turno:", err);
    alert("Ocurrió un error al registrar el turno.");
  }
  };

  function renderTablaTurnos(turnos) {
  const container = document.getElementById("turnosResultado");
  container.innerHTML = "";

  if (!Array.isArray(turnos) || turnos.length === 0) {
    container.innerHTML = "<p>No hay turnos registrados.</p>";
    return;
  }

  const tabla = document.createElement("table");
  tabla.classList.add("tabla-turnos");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Paciente</th>
      <th>Especialidad</th>
      <th>Profesional</th>
      <th>Fecha</th>
    </tr>
  `;
  tabla.appendChild(thead);

  const tbody = document.createElement("tbody");

  turnos.forEach(t => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${t.paciente_nombre || "N/A"}</td>
      <td>${t.especialidad}</td>
      <td>${t.profesional}</td>
      <td>${new Date(t.fecha_turno).toLocaleString()}</td>
    `;
    tbody.appendChild(fila);
  });

  tabla.appendChild(tbody);
  container.appendChild(tabla);
}


  async function listarTurnos() {
    const container = document.getElementById("turnosResultado");

    if (turnosVisibles) {
      container.innerHTML = "";
      turnosVisibles = false;
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/turnos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const turnos = await res.json();

       renderTablaTurnos(turnos);  // Usar la función que definimos
       // turnosVisibles = true;

        if (!Array.isArray(turnos) || turnos.length === 0) {
        container.innerHTML = "<p>No hay turnos registrados.</p>";
      } else {
        container.innerHTML = '';
        turnos.forEach(t => {
          const turnoDiv = document.createElement('div');
          turnoDiv.className = 'turno-box';
          turnoDiv.dataset.id = t.id;

          turnoDiv.innerHTML = `
            <strong>Paciente:</strong> ${t.paciente_nombre || "N/A"}<br>
            <strong>Especialidad:</strong> ${t.especialidad}<br>
            <strong>Profesional:</strong> ${t.profesional}<br>
            <strong>Fecha:</strong> ${new Date(t.fecha_turno).toLocaleString()}
            <div class="turno-acciones">
              <button class="btn-cancelar" style="background:#e74c3c;">Cancelar</button>
              <button class="btn-reprogramar" style="background:#f39c12;">Reprogramar</button>
            </div>
            <div class="reprogramar-div">
              <label>Nuevo día y hora:</label>
              <input type="datetime-local" class="nuevo-fecha" />
              <button class="btn-guardar-reprogramacion">Guardar</button>
              <button class="btn-cancelar-reprogramacion" style="background:#7f8c8d;">Cancelar</button>
            </div>
          `;

          container.appendChild(turnoDiv);
        });

        // Cancelar turno
        container.querySelectorAll('.btn-cancelar').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const turnoDiv = e.target.closest('.turno-box');
            const idTurno = turnoDiv.dataset.id;
            if (!confirm('¿Seguro que deseas cancelar este turno?')) return;

            try {
              const res = await fetch(`http://localhost:3000/api/turnos/${idTurno}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });

              if (res.ok) {
                alert('Turno cancelado correctamente.');
                turnoDiv.remove();
              } else {
                alert('Error al cancelar turno.');
              }
            } catch (err) {
              alert('Error al cancelar turno.');
              console.error(err);
            }
          });
        });

        // Reprogramar turno
        container.querySelectorAll('.btn-reprogramar').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const turnoDiv = e.target.closest('.turno-box');
            const reprogramarDiv = turnoDiv.querySelector('.reprogramar-div');
            reprogramarDiv.style.display = 'block';
          });
        });

        // Guardar reprogramación
        container.querySelectorAll('.btn-guardar-reprogramacion').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const turnoDiv = e.target.closest('.turno-box');
            const nuevoFechaInput = turnoDiv.querySelector('.nuevo-fecha');
            const nuevaFecha = nuevoFechaInput.value;

            if (!nuevaFecha) {
              alert('Seleccione una nueva fecha y hora.');
              return;
            }

            try {
              const idTurno = turnoDiv.dataset.id;

              // Obtener datos actuales del turno para enviar con la actualización
              const resGet = await fetch(`http://localhost:3000/api/turnos/${idTurno}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!resGet.ok) throw new Error('No se pudo obtener el turno');

              const turno = await resGet.json();

              const resPut = await fetch(`http://localhost:3000/api/turnos/${idTurno}`, {
                method: 'PUT',
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  id_paciente: turno.id_paciente || turno.idPaciente,
                  id_especialidad: turno.id_especialidad || turno.especialidad,
                  id_profesional: turno.id_profesional || turno.profesional,
                  fecha_turno: nuevaFecha
                })
              });

              if (resPut.ok) {
                alert('Turno reprogramado correctamente.');
                listarTurnos();
              } else {
                const data = await resPut.json();
                alert(data.mensaje || 'Error al reprogramar turno.');
              }
            } catch (err) {
              alert('Error al reprogramar turno.');
              console.error(err);
            }
          });
        });

        // Cancelar reprogramación
        container.querySelectorAll('.btn-cancelar-reprogramacion').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const turnoDiv = e.target.closest('.turno-box');
            const reprogramarDiv = turnoDiv.querySelector('.reprogramar-div');
            reprogramarDiv.style.display = 'none';
          });
        });

      }

      turnosVisibles = true;
    } catch (err) {
      container.innerHTML = "<p>Error al cargar los turnos.</p>";
      console.error(err);
    }
  }

  window.listarTurnos = listarTurnos;

  // Filtros para Turnos
  const API_BASE = 'http://localhost:3000';

  async function cargarFiltrosTurnos() {
    try {
      const especialidades = await fetch(`${API_BASE}/api/especialidades`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json());

      const profesionales = await fetch(`${API_BASE}/api/profesionales`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json());

      const espeSelect = document.getElementById('selectFiltroEspecialidad');
      const profSelect = document.getElementById('selectFiltroProfesional');

      espeSelect.innerHTML = '<option value="">Todas las especialidades</option>';
      profSelect.innerHTML = '<option value="">Todos los profesionales</option>';

      especialidades.forEach(e => {
        espeSelect.innerHTML += `<option value="${e.id_espe}">${e.nombre}</option>`;
      });

      profesionales.forEach(p => {
        profSelect.innerHTML += `<option value="${p.id_profesional}">${p.nombre_completo}</option>`;
      });
    } catch (err) {
      console.error('Error cargando filtros:', err);
    }
  }

  async function filtrarTurnos() {
    const espe = document.getElementById('selectFiltroEspecialidad').value;
    const prof = document.getElementById('selectFiltroProfesional').value;

    let url = `${API_BASE}/api/turnos?`;
    if (espe) url += `especialidad=${espe}&`;
    if (prof) url += `profesional=${prof}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const turnos = await res.json();
      renderTablaTurnos(turnos);
    } catch (err) {
      console.error('Error al filtrar turnos:', err);
    }
  }

  document.getElementById('btnBuscarTurnos').addEventListener('click', filtrarTurnos);

  // Debés tener esta función renderTablaTurnos definida en tu JS para mostrar resultados filtrados
});
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
