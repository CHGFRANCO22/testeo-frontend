// frontend/agenda.js
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:3000/api";
    const token = localStorage.getItem("token");
    const form = document.getElementById("formAgenda");
    const formTitulo = document.getElementById("formTitulo");
    const tablaAgendasBody = document.querySelector("#tablaAgendas tbody");
    const filtroInput = document.getElementById("filtroProfesional");
    let agendasCache = [];

    // --- Carga Inicial ---
    cargarAgendas();
    cargarProfesionales();

    // --- Eventos ---
    form.addEventListener('submit', guardarAgenda);
    document.getElementById("btnVolver").addEventListener("click", () => window.electronAPI.navegar("dashboard.html"));
    document.getElementById("btnLimpiarForm").addEventListener("click", limpiarFormulario);
    filtroInput.addEventListener('input', () => renderizarAgendas(agendasCache));

    function renderizarAgendas(agendas) {
        const filtroTexto = filtroInput.value.toLowerCase();
        const agendasFiltradas = agendas.filter(a => a.profesional_nombre.toLowerCase().includes(filtroTexto));

        tablaAgendasBody.innerHTML = "";
        if (agendasFiltradas.length === 0) {
            tablaAgendasBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No se encontraron resultados.</td></tr>';
            return;
        }
        agendasFiltradas.forEach(agenda => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${agenda.profesional_nombre}</td><td>${new Date(agenda.fecha).toLocaleDateString('es-AR', {timeZone: 'UTC'})}</td>
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
    
    function abrirParaEditar(id) {
        const agenda = agendasCache.find(a => a.id == id);
        if (!agenda) return;

        formTitulo.textContent = "Editar Horario";
        form.querySelector("#agenda_id").value = agenda.id;
        form.querySelector("#profesional").value = agenda.id_profesional;
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
            id_profesional: form.profesional.value, fecha: form.fecha.value,
            hora_inicio: form.hora_inicio.value, hora_fin: form.hora_fin.value,
        };
        try {
            await apiFetch(url, metodo, body);
            alert(`Agenda ${id ? 'actualizada' : 'creada'} con éxito`);
            limpiarFormulario();
            cargarAgendas();
        } catch (error) { alert(`Error: ${error.message}`); }
    }

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
});
