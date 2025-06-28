// frontend/turnos.js
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:3000/api";
    const token = localStorage.getItem("token");
    const tablaTurnosBody = document.querySelector("#tablaTurnos tbody");
    let turnosCache = [];

    // --- Elementos del DOM ---
    const modalCrear = document.getElementById("modalCrearTurno");
    const formCrear = document.getElementById("formCrearTurno");
    const modalReprogramar = document.getElementById("modalReprogramar");
    const formReprogramar = document.getElementById("formReprogramar");
    const modalHistorial = document.getElementById("modalHistorial");

    // --- Carga Inicial ---
    cargarTurnos();
    cargarSelectsParaCrearTurno();

    // --- Manejadores de Eventos ---
    document.getElementById("btnNuevoTurno").addEventListener("click", () => modalCrear.showModal());
    document.getElementById("btnVolver").addEventListener("click", () => window.electronAPI.navegar("dashboard.html"));
    formCrear.addEventListener("submit", guardarNuevoTurno);
    formReprogramar.addEventListener("submit", guardarReprogramacion);
    
    // Asigna el evento de cierre a TODOS los botones de "cerrar" o "cancelar"
    document.querySelectorAll('.btn-cerrar, dialog form [type="button"]').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('dialog').close());
    });

    // --- Lógica de Disponibilidad Dinámica ---
    const setupAvailabilityChecker = (form) => {
        const profesionalSelect = form.querySelector('select[id*="profesional"]');
        const fechaInput = form.querySelector('input[type="date"]');
        const horaSelect = form.querySelector('select[id*="hora"]');
        
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('min', hoy);
        
        const updateHorarios = async () => {
            const id_profesional = profesionalSelect.value;
            const fecha = fechaInput.value;
            horaSelect.innerHTML = '<option value="">Cargando...</option>';
            if (!id_profesional || !fecha) {
                horaSelect.innerHTML = '<option value="">Seleccione profesional y fecha</option>';
                return;
            }
            try {
                // Llama a la nueva ruta de disponibilidad del backend
                const horarios = await apiFetch(`/turnos/disponibilidad?id_profesional=${id_profesional}&fecha=${fecha}`);
                horaSelect.innerHTML = horarios.length > 0
                    ? horarios.map(h => `<option value="${h}">${h}</option>`).join('')
                    : '<option value="" disabled>No hay horarios disponibles</option>';
            } catch (error) {
                horaSelect.innerHTML = '<option value="">Error al cargar</option>';
            }
        };
        profesionalSelect.addEventListener('change', updateHorarios);
        fechaInput.addEventListener('change', updateHorarios);
    };

    setupAvailabilityChecker(formCrear);
    setupAvailabilityChecker(formReprogramar);
    
    // --- Funciones Principales ---
    async function cargarTurnos() {
        try {
            turnosCache = await apiFetch('/turnos');
            renderizarTabla(turnosCache);
        } catch (error) {
            tablaTurnosBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Error al cargar turnos: ${error.message}</td></tr>`;
        }
    }

    function renderizarTabla(turnos) {
        tablaTurnosBody.innerHTML = "";
        if (!turnos || turnos.length === 0) {
            tablaTurnosBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay turnos para mostrar.</td></tr>';
            return;
        }
        turnos.forEach(turno => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${turno.paciente_nombre || 'N/A'}</td><td>${turno.profesional_nombre || 'N/A'}</td><td>${turno.especialidad_nombre || 'N/A'}</td>
                <td>${new Date(turno.fecha_turno).toLocaleString('es-AR')}</td>
                <td><span class="status-${turno.estado}">${turno.estado.toUpperCase()}</span></td>
                <td>
                    <button class="btn-historial" data-id="${turno.id_paciente}">Historial</button>
                    ${turno.estado !== 'cancelado' ? `<button class="btn-reprogramar" data-id="${turno.id}">Reprogramar</button><button class="btn-cancelar" data-id="${turno.id}">Cancelar</button>` : ''}
                </td>`;
            tr.querySelector('.btn-historial').addEventListener('click', (e) => mostrarHistorial(e.target.dataset.id));
            if(turno.estado !== 'cancelado') {
                tr.querySelector('.btn-reprogramar').addEventListener('click', (e) => abrirModalReprogramar(e.target.dataset.id));
                tr.querySelector('.btn-cancelar').addEventListener('click', (e) => cancelarTurno(e.target.dataset.id));
            }
            tablaTurnosBody.appendChild(tr);
        });
    }

    async function mostrarHistorial(idPaciente) {
        if (!idPaciente) return;
        try {
            const historial = await apiFetch(`/turnos/paciente/${idPaciente}`);
            const tablaBody = document.querySelector("#tablaHistorial tbody");
            tablaBody.innerHTML = !historial || historial.length === 0
                ? '<tr><td colspan="3" style="text-align:center;">Este paciente no tiene historial.</td></tr>'
                : historial.map(t => `<tr><td>${new Date(t.fecha_turno).toLocaleDateString('es-AR')}</td><td>${t.profesional_nombre}</td><td>${t.especialidad_nombre}</td></tr>`).join('');
            modalHistorial.showModal();
        } catch (error) { alert(`Error al obtener el historial: ${error.message}`); }
    }

    function abrirModalReprogramar(idTurno) {
        const turno = turnosCache.find(t => t.id == idTurno);
        if (!turno) return;
        document.getElementById("id_turno_repro").value = idTurno;
        document.getElementById("id_profesional_repro").value = turno.id_profesional;
        formReprogramar.reset();
        modalReprogramar.showModal();
    }
    
    async function guardarReprogramacion(e) {
        e.preventDefault();
        const idTurno = document.getElementById("id_turno_repro").value;
        const fecha = document.getElementById("fecha_repro").value;
        const hora = document.getElementById("hora_repro").value;
        if (!fecha || !hora) return alert("Seleccione fecha y hora.");
        try {
            await apiFetch(`/turnos/reprogramar/${idTurno}`, 'PUT', { fecha_turno: `${fecha}T${hora}:00` });
            alert("Turno reprogramado con éxito.");
            modalReprogramar.close();
            cargarTurnos();
        } catch(error) { alert(`Error al reprogramar: ${error.message}`); }
    }

    async function cancelarTurno(idTurno) {
        if (!confirm("¿Seguro que deseas cancelar este turno?")) return;
        try {
            await apiFetch(`/turnos/cancelar/${idTurno}`, 'PUT');
            alert("Turno cancelado con éxito.");
            cargarTurnos();
        } catch (error) { alert(`Error al cancelar: ${error.message}`); }
    }
    
    async function guardarNuevoTurno(e) {
        e.preventDefault();
        const fecha = formCrear.querySelector("#fecha").value;
        const hora = formCrear.querySelector("#hora").value;
        if (!fecha || !hora) return alert("Seleccione una fecha y un horario disponible.");
        
        const body = {
            id_paciente: formCrear.querySelector("#paciente").value,
            id_especialidad: formCrear.querySelector("#especialidad").value,
            id_profesional: formCrear.querySelector("#profesional").value,
            fecha_turno: `${fecha}T${hora}:00`,
        };
        try {
            await apiFetch('/turnos', 'POST', body);
            alert("Turno creado con éxito.");
            modalCrear.close();
            cargarTurnos();
        } catch(error) { alert(`Error al crear el turno: ${error.message}`); }
    }
    
    async function cargarSelectsParaCrearTurno() {
        try {
            const selPaciente = document.getElementById('paciente');
            const selEspecialidad = document.getElementById('especialidad');
            const selProfesional = document.getElementById('profesional');
            
            const [pacientes, especialidades] = await Promise.all([
                apiFetch('/pacientes/admin/todos'),
                apiFetch('/especialidades'),
            ]);
            
            selPaciente.innerHTML = '<option value="">Seleccionar...</option>' + pacientes.map(p => `<option value="${p.id_paciente}">${p.nombre_completo}</option>`).join('');
            selEspecialidad.innerHTML = '<option value="">Seleccionar...</option>' + especialidades.map(e => `<option value="${e.id_espe}">${e.nombre}</option>`).join('');
            
            selEspecialidad.addEventListener('change', async () => {
                const idEspecialidad = selEspecialidad.value;
                selProfesional.innerHTML = '<option value="">Cargando...</option>';
                if (!idEspecialidad) {
                    selProfesional.innerHTML = '<option value="">Seleccione especialidad</option>';
                    return;
                }
                const profesionales = await apiFetch(`/profesionales/por-especialidad/${idEspecialidad}`);
                selProfesional.innerHTML = '<option value="">Seleccionar...</option>' + profesionales.map(p => `<option value="${p.id_profesional}">${p.nombre_completo}</option>`).join('');
            });
        } catch (error) { console.error("Error cargando selects para el formulario:", error); }
    }

    async function apiFetch(endpoint, method = 'GET', body = null) {
        const url = `${API_BASE_URL}${endpoint}`;
            
        const response = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: body ? JSON.stringify(body) : null
        });
        if (!response.ok) throw new Error((await response.json()).msg || 'Error en la petición');
        const contentType = response.headers.get("content-type");
        if (response.status === 201 || response.status === 204 || !contentType || !contentType.includes("application/json")) {
            return {};
        }
        return response.json();
    }
});
