// frontend/informes.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Variables ---
    const API_URL = 'http://localhost:3000/api/informes'; // URL base de la API de informes
    const token = localStorage.getItem('token'); // Obtener el token guardado en el login
    let charts = {}; // Objeto para almacenar las instancias de los gráficos

    // --- Funciones Auxiliares ---

    /**
     * Función genérica para hacer peticiones a la API
     * @param {string} endpoint - El endpoint específico del informe
     * @param {string} method - Método HTTP (GET, POST, etc.)
     * @returns {Promise<any>} - La data de la respuesta en JSON
     */
    async function fetchData(endpoint) {
        try {
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Enviar el token para la autorización
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
     * Función para crear o actualizar un gráfico
     * @param {string} chartId - ID del elemento canvas
     * @param {string} chartType - Tipo de gráfico (bar, pie, doughnut, line)
     * @param {Array} labels - Etiquetas para el eje X o para las secciones del gráfico
     * @param {Array} datasets - Los conjuntos de datos para el gráfico
     * @param {string} title - Título del gráfico
     */
    function renderChart(chartId, chartType, labels, datasets, title) {
        const ctx = document.getElementById(chartId).getContext('2d');
        
        // Si ya existe un gráfico en este canvas, lo destruimos antes de crear uno nuevo
        if (charts[chartId]) {
            charts[chartId].destroy();
        }
        
        charts[chartId] = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16
                        }
                    }
                },
                 scales: chartType === 'bar' || chartType === 'line' ? {
                    y: {
                        beginAtZero: true
                    }
                } : {}
            }
        });
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
        if (data && data.length > 0) {
            const labels = data.map(item => item.profesional);
            const values = data.map(item => item.cantidad_turnos);

            renderChart('chartTurnosProfesional', 'bar', labels, [{
                label: 'Cantidad de Turnos',
                data: values,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }], 'Turnos Atendidos por Profesional');
        } else if (data) {
             alert('No se encontraron datos para el rango de fechas seleccionado.');
        }
    });

    // 2. Informe de Estado de Turnos
    document.getElementById('btnGenerarEstadoTurnos').addEventListener('click', async () => {
        const data = await fetchData('estado-turnos');
        if (data && data.length > 0) {
            const labels = data.map(item => item.especialidad);
            renderChart('chartEstadoTurnos', 'bar', labels, [
                {
                    label: 'Turnos Cancelados',
                    data: data.map(item => item.turnos_cancelados),
                    backgroundColor: 'rgba(231, 76, 60, 0.7)',
                },
                {
                    label: 'Turnos Reprogramados',
                    data: data.map(item => item.turnos_reprogramados),
                    backgroundColor: 'rgba(241, 196, 15, 0.7)',
                }
            ], 'Estado de Turnos por Especialidad');
        } else if (data) {
            alert('No se encontraron datos de turnos cancelados o reprogramados.');
        }
    });

    // 3. Informe de Especialidades más Demandadas
    document.getElementById('btnGenerarEspecialidades').addEventListener('click', async () => {
        const data = await fetchData('especialidades-demandadas');
        if (data && data.length > 0) {
            const labels = data.map(item => item.especialidad);
            const values = data.map(item => item.cantidad_solicitudes);

            renderChart('chartEspecialidades', 'pie', labels, [{
                label: 'Cantidad de Solicitudes',
                data: values,
                backgroundColor: [
                    'rgba(26, 188, 156, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(155, 89, 182, 0.7)',
                    'rgba(241, 196, 15, 0.7)',
                    'rgba(230, 126, 34, 0.7)',
                ],
            }], 'Especialidades Más Demandadas');
        } else if (data) {
            alert('No se encontraron datos de turnos para analizar la demanda.');
        }
    });
    
    // 4. Informe de Horarios de Demanda
    document.getElementById('btnGenerarHorarios').addEventListener('click', async () => {
        const data = await fetchData('horarios-demanda');
        if (data && data.length > 0) {
            const labels = data.map(item => `${item.hora}:00`);
            const values = data.map(item => item.cantidad_turnos);

            renderChart('chartHorarios', 'line', labels, [{
                label: 'Cantidad de Turnos',
                data: values,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }], 'Demanda de Turnos por Hora del Día');
        } else if (data) {
            alert('No se encontraron datos para analizar los horarios.');
        }
    });

    // --- Navegación ---
    document.getElementById('btnVolver').addEventListener('click', () => {
        window.electronAPI.navegar('dashboard.html');
    });
});
