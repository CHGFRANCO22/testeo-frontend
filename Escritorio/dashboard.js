document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("cerrarSesion").addEventListener("click", () => {
    localStorage.clear();
    window.electronAPI.logout();
  });

  document.getElementById("btnPacientes").addEventListener("click", () => {
    window.electronAPI.navegar("pacientes.html");
  });

  document.getElementById("btnTurnos").addEventListener("click", () => {
    window.electronAPI.navegar("turnos.html");
  });

  document.getElementById("btnInformes").addEventListener("click", () => {
    window.electronAPI.navegar("informes.html");
  });
});
