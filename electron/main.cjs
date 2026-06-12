const { app, BrowserWindow } = require('electron');
const path = require('path');

// in dev carichiamo il server vite, in produzione il build statico
const DEV_URL = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        backgroundColor: '#000000',
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (DEV_URL) {
        win.loadURL(DEV_URL);
    } else {
        win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
