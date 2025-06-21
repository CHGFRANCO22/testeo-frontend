const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow(file = 'login.html') {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'Escritorio', file));
}

// Evento para cerrar sesión desde renderer
ipcMain.on('cerrar-sesion', () => {
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  createWindow('login.html');
});

app.whenReady().then(() => createWindow());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
