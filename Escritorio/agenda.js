// frontend/agenda.js
document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Variables y Elementos del DOM ---
    const API_BASE_URL = "http://localhost:3000/api";
    const token = localStorage.getItem("token");
    const form = document.getElementById("formAgenda");
    const formTitulo = document.getElementById("formTitulo");
    const tablaAgendasBody = document.querySelector("#tablaAgendas tbody");
    const filtroInput = document.getElementById("filtroProfesional");
    let agendasCache = [];

    // --- 2. Definición de TODAS las Funciones ---

    async function apiFetch(endpoint, method = 'GET', body = null) {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: body ? JSON.stringify(body) : null,
        });
        if (!response.ok) throw new Error((await response.json()).msg || 'Error en la petición');
        const contentType = response.headers.get("content-type");
        if (response.status === 204 || !contentType || !contentType.includes("application/json")) return {};
        return response.json();
    }
    
    function renderizarAgendas(agendas) {
        const filtroTexto = filtroInput.value.toLowerCase();
        const agendasFiltradas = agendas.filter(a => 
            a.profesional_nombre.toLowerCase().includes(filtroTexto)
        );

        tablaAgendasBody.innerHTML = "";
        if (agendasFiltradas.length === 0) {
            tablaAgendasBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No se encontraron resultados.</td></tr>';
            return;
        }
        agendasFiltradas.forEach(agenda => {
            const tr = document.createElement('tr');
            // CORRECCIÓN: Se usa new Date() con la fecha YYYY-MM-DD y se añade timeZone 'UTC'
            // para evitar que la fecha se muestre como el día anterior.
            const fechaFormateada = new Date(agenda.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' });
            
            tr.innerHTML = `
                <td>${agenda.profesional_nombre}</td><td>${fechaFormateada}</td>
                <td>${agenda.hora_inicio}</td><td>${agenda.hora_fin}</td>
                <td>
                    <button class="btn-edit" data-id="${agenda.id}">Editar</button>
                    <button class="btn-delete" data-id="${agenda.id}">Eliminar</button>
                </td>
            `;
            tr.querySelector('.btn-edit').addEventListener('click', (e) => abrirParaEditar(e.target.dataset.id));
            tr.querySelector('.btn-delete').addEventListener('click', (e) => eliminarAgenda(e.target.dataset.id));
            tablaAgendasBody.appendChild(tr);
        });
    }
    
    async function cargarAgendas() {
        try {
            agendasCache = await apiFetch('/agenda');
            renderizarAgendas(agendasCache);
        } catch (error) { 
            console.error("Error cargando agendas:", error);
            tablaAgendasBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar la agenda.</td></tr>';
        }
    }

    async function cargarProfesionales() {
        try {
            const selectProfesional = document.getElementById("profesional");
            const profesionales = await apiFetch('/profesionales');
            selectProfesional.innerHTML = '<option value="">Seleccionar...</option>' + 
                profesionales.map(p => `<option value="${p.id_profesional}">${p.nombre_completo}</option>`).join('');
        } catch (error) { 
            console.error("Error cargando profesionales:", error);
        }
    }
    
    function abrirParaEditar(id) {
        const agenda = agendasCache.find(a => a.id == id);
        if (!agenda) return;

        formTitulo.textContent = "Editar Horario";
        form.querySelector("#agenda_id").value = agenda.id;
        form.querySelector("#profesional").value = agenda.id_profesional;
        // CORRECCIÓN: El input de tipo "date" espera el formato YYYY-MM-DD, que ahora es el que envía el backend.
        form.querySelector("#fecha").value = agenda.fecha;
        form.querySelector("#hora_inicio").value = agenda.hora_inicio;
        form.querySelector("#hora_fin").value = agenda.hora_fin;
    }

    function limpiarFormulario() {
        formTitulo.textContent = "Crear Nuevo Horario";
        form.reset();
        form.querySelector("#agenda_id").value = "";
    }

    async function guardarAgenda(e) {
        e.preventDefault();
        const id = form.querySelector("#agenda_id").value;
        const metodo = id ? 'PUT' : 'POST';
        const url = id ? `/agenda/${id}` : '/agenda';
        
        const body = {
            id_profesional: form.querySelector("#profesional").value,
            fecha: form.querySelector("#fecha").value,
            hora_inicio: form.querySelector("#hora_inicio").value,
            hora_fin: form.querySelector("#hora_fin").value,
        };
        try {
            await apiFetch(url, metodo, body);
            alert(`Agenda ${id ? 'actualizada' : 'creada'} con éxito`);
            limpiarFormulario();
            cargarAgendas();
        } catch (error) { alert(`Error: ${error.message}`); }
    }

    async function eliminarAgenda(id) {
        if (!confirm("¿Seguro que deseas eliminar este horario?")) return;
        try {
            await apiFetch(`/agenda/${id}`, 'DELETE');
            alert("Agenda eliminada");
            cargarAgendas();
        } catch (error) { alert(`Error: ${error.message}`); }
    }

    // --- 3. Ejecución Inicial y Event Listeners ---

    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').setAttribute('min', hoy);

    form.addEventListener('submit', guardarAgenda);
    document.getElementById("btnVolver").addEventListener("click", () => window.electronAPI.navegar("dashboard.html"));
    document.getElementById("btnLimpiarForm").addEventListener("click", limpiarFormulario);
    filtroInput.addEventListener('input', () => renderizarAgendas(agendasCache));

    cargarAgendas();
    cargarProfesionales();
});
