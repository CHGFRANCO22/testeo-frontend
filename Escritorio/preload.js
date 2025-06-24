const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  logout: () => ipcRenderer.send('cerrar-sesion'),
  irA: (archivo) => ipcRenderer.send('ir-a', archivo),
});
