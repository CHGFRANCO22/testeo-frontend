// frontend/turnos.js
document.addEventListener("DOMContentLoaded", () => {
    // --- VARIABLES GLOBALES Y ELEMENTOS DEL DOM ---
    const API_BASE_URL = "http://localhost:3000/api";
    const token = localStorage.getItem("token");

    const tablaTurnosBody = document.querySelector("#tablaTurnos tbody");
    const modalCrearTurno = document.getElementById("modalCrearTurno");
    const modalReprogramar = document.getElementById("modalReprogramar");
    const modalHistorial = document.getElementById("modalHistorial");

    // --- CARGA INICIAL ---
    cargarTurnos();
    cargarSelectsParaCrearTurno();

    // --- MANEJADORES DE EVENTOS PRINCIPALES ---
    document.getElementById("btnNuevoTurno").addEventListener("click", () => modalCrearTurno.showModal());
    document.getElementById("btnVolver").addEventListener("click", () => window.electronAPI.navegar("dashboard.html"));
    document.getElementById("formCrearTurno").addEventListener("submit", guardarNuevoTurno);
    document.getElementById("formReprogramar").addEventListener("submit", guardarReprogramacion);

    // Cerrar modales
    document.getElementById("btnCancelar").addEventListener("click", () => modalCrearTurno.close());
    document.getElementById("btnCancelarRepro").addEventListener("click", () => modalReprogramar.close());
    document.getElementById("cerrarHistorial").addEventListener("click", () => modalHistorial.close());

    // --- FUNCIONES PRINCIPALES ---

    async function cargarTurnos() {
        try {
            const turnos = await apiFetch('/turnos');
            tablaTurnosBody.innerHTML = "";
            if (turnos.length === 0) {
                tablaTurnosBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay turnos para mostrar.</td></tr>';
                return;
            }

            turnos.forEach(turno => {
                const tr = document.createElement('tr');
                const fecha = new Date(turno.fecha_turno);
                
                tr.innerHTML = `
                    <td>${turno.paciente_nombre}</td>
                    <td>${turno.profesional}</td>
                    <td>${turno.especialidad}</td>
                    <td>${fecha.toLocaleString('es-AR')}</td>
                    <td><span class="status-${turno.estado}">${turno.estado.toUpperCase()}</span></td>
                    <td>
                        <button class="btn-historial" data-paciente-id="${turno.id_paciente}">Historial</button>
                        ${turno.estado !== 'cancelado' ? `
                            <button class="btn-reprogramar" data-turno-id="${turno.id}">Reprogramar</button>
                            <button class="btn-cancelar" data-turno-id="${turno.id}">Cancelar</button>
                        ` : ''}
                    </td>
                `;
                tablaTurnosBody.appendChild(tr);
            });
            // Asignar eventos después de crear los botones
            asignarEventosBotones();

        } catch (error) {
            tablaTurnosBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Error al cargar turnos.</td></tr>`;
            console.error(error);
        }
    }

    function asignarEventosBotones() {
        document.querySelectorAll('.btn-historial').forEach(btn => btn.addEventListener('click', e => mostrarHistorial(e.target.dataset.pacienteId)));
        document.querySelectorAll('.btn-reprogramar').forEach(btn => btn.addEventListener('click', e => abrirModalReprogramar(e.target.dataset.turnoId)));
        document.querySelectorAll('.btn-cancelar').forEach(btn => btn.addEventListener('click', e => cancelarTurno(e.target.dataset.turnoId)));
    }

    async function mostrarHistorial(idPaciente) {
        const tablaHistorialBody = document.querySelector("#tablaHistorial tbody");
        try {
            const historial = await apiFetch(`/turnos/paciente/${idPaciente}`);
            tablaHistorialBody.innerHTML = "";
            if (historial.length === 0) {
                 tablaHistorialBody.innerHTML = '<tr><td colspan="3">Este paciente no tiene historial.</td></tr>';
            } else {
                historial.forEach(t => {
                    tablaHistorialBody.innerHTML += `<tr><td>${new Date(t.fecha_turno).toLocaleDateString('es-AR')}</td><td>${t.profesional}</td><td>${t.especialidad}</td></tr>`;
                });
            }
            modalHistorial.showModal();
        } catch (error) {
            alert("Error al obtener el historial.");
            console.error(error);
        }
    }
    
    function abrirModalReprogramar(idTurno) {
        document.getElementById("id_turno_repro").value = idTurno;
        document.getElementById("formReprogramar").reset(); // Limpia fecha anterior
        modalReprogramar.showModal();
    }

    async function guardarReprogramacion(e) {
        e.preventDefault();
        const idTurno = document.getElementById("id_turno_repro").value;
        const nuevaFecha = document.getElementById("fecha_repro").value;
        try {
            await apiFetch(`/turnos/reprogramar/${idTurno}`, 'PUT', { fecha_turno: nuevaFecha });
            alert("Turno reprogramado con éxito.");
            modalReprogramar.close();
            cargarTurnos();
        } catch(error) {
            alert("Error al reprogramar el turno.");
        }
    }

    async function cancelarTurno(idTurno) {
        try {
            await apiFetch(`/turnos/cancelar/${idTurno}`, 'PUT');
            alert("Turno cancelado con éxito.");
            cargarTurnos();
        } catch (error) {
            alert("Error al cancelar el turno.");
        }
    }
    
    async function guardarNuevoTurno(e) {
        e.preventDefault();
        const body = {
            id_paciente: document.getElementById("paciente").value,
            id_especialidad: document.getElementById("especialidad").value,
            id_profesional: document.getElementById("profesional").value,
            fecha_turno: document.getElementById("fecha").value,
        };
        try {
            await apiFetch('/turnos', 'POST', body);
            alert("Turno creado con éxito.");
            modalCrearTurno.close();
            document.getElementById("formCrearTurno").reset();
            cargarTurnos();
        } catch(error) {
            alert("Error al crear el turno.");
        }
    }

    async function cargarSelectsParaCrearTurno() {
        const selectPaciente = document.getElementById('paciente');
        const selectEspecialidad = document.getElementById('especialidad');
        
        const pacientes = await apiFetch('/pacientes/admin/todos');
        selectPaciente.innerHTML = '<option value="">Seleccionar...</option>';
        pacientes.forEach(p => selectPaciente.innerHTML += `<option value="${p.id_paciente}">${p.nombre_completo}</option>`);

        // Aquí deberías tener una ruta para obtener especialidades y profesionales
        // const especialidades = await apiFetch('/especialidades');
        // Lógica similar para llenar los otros selects...
    }

    // --- FUNCIÓN UTILITARIA ---
    async function apiFetch(endpoint, method = 'GET', body = null) {
        const url = `${API_BASE_URL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || `Error en la petición a ${endpoint}`);
        }
        return response.json();
    }
});
