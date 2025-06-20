const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow; // 🔧 Declarar mainWindow en ámbito global

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'login.html'));
}

app.whenReady().then(createWindow);

// Mac: volver a abrir ventana si se cierra
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Cerrar en Windows/Linux
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
