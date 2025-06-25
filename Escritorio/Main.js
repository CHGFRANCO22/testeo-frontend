const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow(archivo = 'login.html') {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, archivo));
}

ipcMain.on('cerrar-sesion', () => {
  if (mainWindow) mainWindow.close();
  createWindow('login.html');
});

ipcMain.on('navegar-a', (_e, archivo) => {
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, archivo));
  }
});

app.whenReady().then(() => createWindow());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
