const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Directory operations
  selectDirectory: (type) => ipcRenderer.invoke('select-directory', type),
  
  // Image operations
  loadImages: (directoryPath) => ipcRenderer.invoke('load-images', directoryPath),
  getImageDimensions: (imagePath) => ipcRenderer.invoke('get-image-dimensions', imagePath),
  
  // Caption operations
  loadCaption: (imagePath) => ipcRenderer.invoke('load-caption', imagePath),
  saveCaption: (imagePath, caption) => ipcRenderer.invoke('save-caption', imagePath, caption),
  
  // Cropping operations
  saveCroppedImage: (data) => ipcRenderer.invoke('save-cropped-image', data),
  
  // Utility functions
  joinPath: (...args) => ipcRenderer.invoke('join-path', ...args)
});