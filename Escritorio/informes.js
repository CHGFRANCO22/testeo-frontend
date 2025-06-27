// frontend/informes.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api/informes';
    const token = localStorage.getItem('token');

    /**
     * Función genérica para hacer peticiones a la API
     */
    async function fetchData(endpoint) {
        try {
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Error en la petición');
            }
            return await response.json();
        } catch (error) {
            console.error(`Error obteniendo datos de ${endpoint}:`, error);
            alert(`Error al generar el informe: ${error.message}`);
            return null;
        }
    }

    /**
     * Función para crear y mostrar una tabla HTML con los datos del informe
     * @param {string} containerId - ID del div donde se insertará la tabla
     * @param {Array<string>} headers - Un array con los títulos de las columnas
     * @param {Array<Object>} data - Los datos recibidos de la API
     */
    function renderTable(containerId, headers, data) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Limpiar cualquier contenido anterior

        if (!data || data.length === 0) {
            container.innerHTML = '<p>No se encontraron datos para mostrar.</p>';
            return;
        }

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');

        // Crear los encabezados de la tabla
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Crear las filas con los datos
        data.forEach(item => {
            const row = document.createElement('tr');
            Object.values(item).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        container.appendChild(table);
    }

    // --- Lógica de los Informes ---

    // 1. Informe de Turnos por Profesional
    document.getElementById('btnGenerarTurnosProfesional').addEventListener('click', async () => {
        const fechaInicio = document.getElementById('fecha_inicio').value;
        const fechaFin = document.getElementById('fecha_fin').value;
        if (!fechaInicio || !fechaFin) {
            alert('Por favor, seleccione un rango de fechas.');
            return;
        }
        const data = await fetchData(`turnos-por-profesional?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
        renderTable('tablaTurnosProfesional', ['Profesional', 'Cantidad de Turnos'], data);
    });

    // 2. Informe de Estado de Turnos
    document.getElementById('btnGenerarEstadoTurnos').addEventListener('click', async () => {
        const data = await fetchData('estado-turnos');
        renderTable('tablaEstadoTurnos', ['Especialidad', 'Turnos Cancelados', 'Turnos Reprogramados'], data);
    });

    // 3. Informe de Especialidades más Demandadas
    document.getElementById('btnGenerarEspecialidades').addEventListener('click', async () => {
        const data = await fetchData('especialidades-demandadas');
        renderTable('tablaEspecialidades', ['Especialidad', 'Cantidad de Solicitudes'], data);
    });
    
    // 4. Informe de Horarios de Demanda
    document.getElementById('btnGenerarHorarios').addEventListener('click', async () => {
        const data = await fetchData('horarios-demanda');
        const formattedData = data ? data.map(item => ({...item, hora: `${item.hora}:00 - ${item.hora + 1}:00`})) : [];
        renderTable('tablaHorarios', ['Franja Horaria', 'Cantidad de Turnos'], formattedData);
    });

    // --- Navegación ---
    document.getElementById('btnVolver').addEventListener('click', () => {
        window.electronAPI.navegar('dashboard.html');
    });
});
