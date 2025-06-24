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

  mainWindow.loadFile(path.join(__dirname, file));
}

ipcMain.on('cerrar-sesion', () => {
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, 'login.html'));
  }
});

ipcMain.on('ir-a', (_, archivo) => {
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, archivo));
  }
});

app.whenReady().then(() => createWindow());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
