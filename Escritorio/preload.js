const { contextBridge, ipcRenderer } = require('electron');

// Expone funcionalidades al contexto del navegador
contextBridge.exposeInMainWorld('electronAPI', {
  logout: () => ipcRenderer.send('cerrar-sesion'),
  fetchData: async (url, options) => {
    const res = await fetch(url, options);
    return await res.json();
  }
});
