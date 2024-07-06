const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let backend;

const createWindow = () => {
  const win = new BrowserWindow({
    title: "Reckon Up(Developed By Nirex)",
    width: 1366,
    height: 768,
    webPreferences: {
      // preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '../assets/reckonUp_256x256.ico')
  });
  win.loadFile(path.join(__dirname, "../build/index.html"));
  win.removeMenu();
  win.setMinimumSize(1300, 750);
};

app.whenReady().then(() => {

  backend = spawn('node', [path.join(__dirname, '../backend/server.js')], { stdio: "overlapped" });

  backend.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backend.stderr.on('data', (data) => {
    console.error(`Backend error: ${data}`);
  });

  backend.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  createWindow();

  app.on('before-quit', () => {
    if (backend) {
      backend.kill('SIGINT'); // Send SIGINT to gracefully stop the backend
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}).catch((error) => {
  console.log(error)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});
