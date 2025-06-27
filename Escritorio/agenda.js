// frontend/agenda.js
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:3000/api";
    const token = localStorage.getItem("token");
    const form = document.getElementById("formAgenda");
    const selectProfesional = document.getElementById("profesional");
    const tablaAgendasBody = document.querySelector("#tablaAgendas tbody");

    // --- Carga Inicial ---
    cargarAgendas();
    cargarProfesionales();

    // --- Eventos ---
    form.addEventListener('submit', crearAgenda);
    document.getElementById("btnVolver").addEventListener("click", () => window.electronAPI.navegar("dashboard.html"));

    // --- Funciones ---
    async function cargarAgendas() {
        try {
            const agendas = await apiFetch('/agenda');
            tablaAgendasBody.innerHTML = "";
            agendas.forEach(agenda => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${agenda.profesional_nombre}</td>
                    <td>${agenda.fecha}</td>
                    <td>${agenda.hora_inicio}</td>
                    <td>${agenda.hora_fin}</td>
                    <td><button class="btn-delete" data-id="${agenda.id}">Eliminar</button></td>
                `;
                tr.querySelector('.btn-delete').addEventListener('click', (e) => eliminarAgenda(e.target.dataset.id));
                tablaAgendasBody.appendChild(tr);
            });
        } catch (error) {
            console.error("Error cargando agendas:", error);
        }
    }

    async function cargarProfesionales() {
        try {
            // Reutilizamos la ruta existente para obtener todos los profesionales
            const profesionales = await apiFetch('/profesionales');
            selectProfesional.innerHTML = '<option value="">Seleccionar...</option>';
            profesionales.forEach(p => {
                selectProfesional.innerHTML += `<option value="${p.id_profesional}">${p.nombre_completo}</option>`;
            });
        } catch (error) {
            console.error("Error cargando profesionales:", error);
        }
    }

    async function crearAgenda(e) {
        e.preventDefault();
        const body = {
            id_profesional: form.profesional.value,
            fecha: form.fecha.value,
            hora_inicio: form.hora_inicio.value,
            hora_fin: form.hora_fin.value,
        };
        try {
            await apiFetch('/agenda', 'POST', body);
            alert("Agenda creada con éxito");
            form.reset();
            cargarAgendas(); // Recargar la lista
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    async function eliminarAgenda(id) {
        if (!confirm("¿Seguro que deseas eliminar este horario?")) return;
        try {
            await apiFetch(`/agenda/${id}`, 'DELETE');
            alert("Agenda eliminada");
            cargarAgendas();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
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
