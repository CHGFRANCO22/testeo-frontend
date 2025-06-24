// dashboard.js
import { verificarSesion } from "./modules/sesion.js";

verificarSesion();

document.addEventListener("DOMContentLoaded", () => {
  const { electronAPI } = window;

  document.getElementById("btnPacientes").addEventListener("click", () => {
  window.electronAPI.irA('pacientes.html');
});


  document.getElementById("btnTurnos").addEventListener("click", () => {
    electronAPI.cargarVista("turnos.html");
  });

  document.getElementById("btnInformes").addEventListener("click", () => {
    electronAPI.cargarVista("informes.html");
  });

  document.getElementById("cerrarSesion").addEventListener("click", () => {
    localStorage.clear();
    electronAPI.cerrarSesion();
  });
});
