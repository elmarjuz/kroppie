const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: (type) => ipcRenderer.invoke('select-directory', type),
  
  loadImages: (directoryPath) => ipcRenderer.invoke('load-images', directoryPath),
  getImageDimensions: (imagePath) => ipcRenderer.invoke('get-image-dimensions', imagePath),
  
  loadCaption: (imagePath) => ipcRenderer.invoke('load-caption', imagePath),
  saveCaption: (imagePath, caption) => ipcRenderer.invoke('save-caption', imagePath, caption),
  
  saveCroppedImage: (data) => ipcRenderer.invoke('save-cropped-image', data),
  
  joinPath: (...args) => ipcRenderer.invoke('join-path', ...args),
  ensureDirectory: (dirPath) => ipcRenderer.invoke('ensure-directory', dirPath)
});