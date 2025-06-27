// frontend/pacientes.js

document.addEventListener("DOMContentLoaded", () => {
    // --- VARIABLES Y ELEMENTOS DEL DOM ---
    const API_URL = "http://localhost:3000/api/pacientes";
    const token = localStorage.getItem("token");
    const tbody = document.querySelector("#tablaPacientes tbody");
    const dialog = document.getElementById("formPopup");
    const form = document.getElementById("formPaciente");
    const formTitle = document.getElementById("formTitulo");
    const passwordFields = document.getElementById("password-fields");

    // --- CARGA INICIAL ---
    cargarPacientes();

    // --- MANEJADORES DE EVENTOS ---
    document.getElementById("btnAgregar").addEventListener("click", abrirFormularioParaCrear);
    document.getElementById("btnCancelar").addEventListener("click", () => dialog.close());
    document.getElementById("btnVolver").addEventListener("click", () => window.electronAPI.navegar("dashboard.html"));
    form.addEventListener("submit", guardarPaciente);

    // --- FUNCIONES ---

    async function cargarPacientes() {
        // **LA SOLUCIÓN AL PROBLEMA "SIN DATOS" ESTÁ AQUÍ**
        // Llamamos a la nueva ruta del backend exclusiva para administradores.
        try {
            const res = await fetch(`${API_URL}/admin/todos`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
            const pacientes = await res.json();
            
            tbody.innerHTML = ""; // Limpiar tabla
            if (pacientes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay pacientes registrados.</td></tr>';
                return;
            }

            pacientes.forEach(p => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${p.nombre_completo}</td>
                    <td>${p.edad}</td>
                    <td>${p.dni}</td>
                    <td>${p.email}</td>
                    <td>${p.sexo}</td>
                    <td>
                        <button class="btn-edit" data-id="${p.id_paciente}">Editar</button>
                        <button class="btn-delete" data-id="${p.id_paciente}">Eliminar</button>
                    </td>
                `;
                // Añadir eventos a los botones de forma segura
                tr.querySelector(".btn-edit").addEventListener("click", () => abrirFormularioParaEditar(p));
                tr.querySelector(".btn-delete").addEventListener("click", () => eliminarPaciente(p.id_paciente));

                tbody.appendChild(tr);
            });
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Error al cargar pacientes.</td></tr>`;
            console.error(e);
        }
    }

    function abrirFormularioParaCrear() {
        form.reset();
        form.dataset.id = ""; // Limpiar ID del formulario
        formTitle.textContent = "Nuevo Paciente";
        passwordFields.style.display = "block"; // Mostrar campos de contraseña
        document.getElementById("contrasena").required = true;
        dialog.showModal();
    }

    function abrirFormularioParaEditar(paciente) {
        form.reset();
        form.dataset.id = paciente.id_paciente; // Guardar ID en el formulario
        formTitle.textContent = "Editar Paciente";
        
        // Llenar el formulario con los datos del paciente
        document.getElementById("nombre_completo").value = paciente.nombre_completo;
        document.getElementById("edad").value = paciente.edad;
        document.getElementById("dni").value = paciente.dni;
        document.getElementById("email").value = paciente.email;
        document.getElementById("sexo").value = paciente.sexo;

        passwordFields.style.display = "none"; // Ocultar campos de contraseña
        document.getElementById("contrasena").required = false;
        dialog.showModal();
    }

    async function guardarPaciente(e) {
        e.preventDefault();
        const id = form.dataset.id;
        const metodo = id ? "PUT" : "POST";
        const url = id ? `${API_URL}/${id}` : API_URL;

        const body = {
            nombre_completo: document.getElementById("nombre_completo").value,
            edad: document.getElementById("edad").value,
            dni: document.getElementById("dni").value,
            email: document.getElementById("email").value,
            sexo: document.getElementById("sexo").value,
        };

        // Si es un nuevo paciente, añadir y validar contraseña
        if (!id) {
            const contrasena = document.getElementById("contrasena").value;
            const repetirContrasena = document.getElementById("repetir_contrasena").value;
            if (contrasena.length < 4) {
                alert("La contraseña debe tener al menos 4 caracteres.");
                return;
            }
            if (contrasena !== repetirContrasena) {
                alert("Las contraseñas no coinciden.");
                return;
            }
            body.contrasena = contrasena;
        }

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.msg || "Error al guardar los datos.");
            }
            alert("Paciente guardado correctamente");
            dialog.close();
            cargarPacientes();
        } catch (err) {
            alert(`Error: ${err.message}`);
            console.error(err);
        }
    }

    async function eliminarPaciente(id) {
        // En una app real, aquí mostrarías un modal de confirmación.
        // Por simplicidad, procedemos directamente.
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("No se pudo eliminar el paciente.");
            alert("Paciente eliminado.");
            cargarPacientes();
        } catch (e) {
            alert(`Error: ${e.message}`);
            console.error(e);
        }
    }
});
