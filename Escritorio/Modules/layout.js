// modules/layout.js
export function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggle-btn');
  const content = document.getElementById('content');
  const sections = document.querySelectorAll('.section');
  const menuItems = document.querySelectorAll('#menuList li');

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (usuario.rol === "secretaria") {
    document.getElementById("pacientes")?.remove();
    document.getElementById("perfil")?.remove();
    menuItems.forEach(li => {
      if (li.getAttribute("onclick")?.includes("pacientes") || li.getAttribute("onclick")?.includes("perfil")) {
        li.remove();
      }
    });
  }

  toggleBtn.onclick = () => {
    sidebar.classList.toggle('hide');
    content.classList.toggle('fullwidth');
  };

  window.showSection = function (sectionId) {
    if (sectionId === 'turnos') {
      window.cargarFiltrosTurnos?.();
      window.listarTurnos?.();
    }

    sections.forEach(s => {
      s.style.display = s.id === sectionId ? 'block' : 'none';
    });

    menuItems.forEach(li => {
      li.classList.toggle('active', li.getAttribute('onclick')?.includes(sectionId));
    });
  };

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.electronAPI?.logout?.();
  });

  // Mostrar la sección inicial
  window.showSection('pacientes');
}
