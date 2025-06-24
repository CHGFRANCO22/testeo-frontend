// dashboard.js
import { verificarSesion } from "./modules/sesion.js";

verificarSesion();

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnPacientes").addEventListener("click", () => {
    window.location.href = "pacientes.html";
  });

  document.getElementById("btnTurnos").addEventListener("click", () => {
    window.location.href = "turnos.html";
  });

  document.getElementById("btnInformes").addEventListener("click", () => {
    window.location.href = "informes.html";
  });

  document.getElementById("cerrarSesion").addEventListener("click", () => {
    localStorage.clear();
    window.electronAPI.logout();
  });
});
