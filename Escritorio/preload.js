const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  logout: () => ipcRenderer.send("cerrar-sesion"),
  navegar: (ruta) => ipcRenderer.send("navegar", ruta)
});
