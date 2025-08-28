const { app, BrowserWindow, dialog, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');

const isDev = process.argv.includes('--dev') || process.env.ELECTRON_IS_DEV === 'true';
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Kroppie - LoRA Dataset Cropper'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('select-directory', async (event, type) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: `Select ${type} Directory`,
    defaultPath: process.cwd()
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('load-images', async (event, directoryPath) => {
  try {
    const files = await fs.readdir(directoryPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'];
    
    const imageFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map(file => ({
        name: file,
        path: path.join(directoryPath, file),
        processed: false
      }));

    return imageFiles;
  } catch (error) {
    console.error('Error loading images:', error);
    return [];
  }
});

ipcMain.handle('load-caption', async (event, imagePath) => {
  try {
    const captionPath = imagePath.replace(/\.[^/.]+$/, '.txt');
    if (existsSync(captionPath)) {
      const caption = await fs.readFile(captionPath, 'utf8');
      return caption.trim();
    }
    return '';
  } catch (error) {
    console.error('Error loading caption:', error);
    return '';
  }
});

ipcMain.handle('save-caption', async (event, imagePath, caption) => {
  try {
    const captionPath = imagePath.replace(/\.[^/.]+$/, '.txt');
    await fs.writeFile(captionPath, caption, 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving caption:', error);
    return false;
  }
});

ipcMain.handle('save-cropped-image', async (event, { sourcePath, outputPath, cropData, imageBuffer }) => {
  try {
    await fs.writeFile(outputPath, imageBuffer);
    return true;
  } catch (error) {
    console.error('Error saving cropped image:', error);
    return false;
  }
});

ipcMain.handle('get-image-dimensions', async (event, imagePath) => {
  try {
    const image = nativeImage.createFromPath(imagePath);
    const size = image.getSize();
    return {
      width: size.width,
      height: size.height
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return { width: 1920, height: 1080 };
  }
});

ipcMain.handle('join-path', async (event, ...args) => {
  return path.join(...args);
});

ipcMain.handle('ensure-directory', async (event, dirPath) => {
  try {
    if (!existsSync(dirPath)) {
      await fs.mkdir(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});