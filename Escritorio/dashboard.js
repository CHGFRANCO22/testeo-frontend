 // dashboard.js (script principal modular)
import { verificarSesion, aplicarRol } from "./modules/sesion.js";
import { configurarSidebar, showSection } from "./modules/layout.js";
import { initPacientes } from "./modules/pacientes.js";
import { initTurnos } from "./modules/turnos.js";

window.showSection = showSection;

verificarSesion();
document.addEventListener("DOMContentLoaded", () => {
  aplicarRol();
  configurarSidebar();
  initPacientes();
  initTurnos();
});
