document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnPacientes").addEventListener("click", () => {
        window.electronAPI.navegar("pacientes.html");
    });

    document.getElementById("btnTurnos").addEventListener("click", () => {
        window.electronAPI.navegar("turnos.html");
    });
    
    // LÓGICA NUEVA
    document.getElementById("btnAgenda").addEventListener("click", () => {
        window.electronAPI.navegar("agenda.html");
    });

    document.getElementById("btnInformes").addEventListener("click", () => {
        window.electronAPI.navegar("informes.html");
    });

    document.getElementById("cerrarSesion").addEventListener("click", () => {
        localStorage.clear();
        window.electronAPI.logout();
    });
});