const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  logout: () => ipcRenderer.send('cerrar-sesion'),
  navegar: (archivo) => ipcRenderer.send('navegar-a', archivo),
});
