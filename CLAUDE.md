# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start the application in development mode with hot-reload enabled
- `npm start` - Start the application in production mode
- `npm run build` - Build the application for distribution using electron-builder

## Project Architecture

Kroppie is an Electron-based desktop application for cropping images and managing captions for LoRA dataset preparation. The application follows a standard Electron architecture:

### Core Structure
- **Main Process** (`src/main.js`) - Handles window management, file system operations, and IPC communication
- **Renderer Process** (`src/renderer.js`) - Manages UI state and user interactions
- **Preload Script** (`src/preload.js`) - Securely exposes main process APIs to renderer via contextBridge

### Key Features
- **Directory Management**: Source and output folder selection with native OS dialogs
- **Image Processing**: Loads images from directory, supports common formats (jpg, png, bmp, gif, webp)
- **Precise Cropping**: 512×512 pixel crop area with accurate scaling and positioning using Canvas API
- **Caption Management**: Individual image captions + shared tags system with automatic file I/O
- **Auto-Navigation**: Automatically moves to next unprocessed image after cropping
- **Progress Tracking**: Visual indicators for processed vs pending images

### File System Integration
The application uses Electron's native APIs for file operations:
- `dialog.showOpenDialog()` for directory selection
- `fs.readdir()` with image filtering for loading images
- `fs.readFile()/writeFile()` for caption management
- `nativeImage.createFromPath()` for getting image dimensions
- Canvas API for image cropping and processing

### UI Components
Built with vanilla HTML/CSS/JS without external frameworks:
- **Sidebar**: Directory controls, image gallery, and caption inputs
- **Main Area**: Toolbar, image workspace with crop overlay, status bar
- **Crop System**: Interactive drag-to-position crop area with visual feedback

### State Management
Application state is managed in a centralized CroppieApp class:
- Image list and current selection
- Crop area coordinates and scaling
- Processing status tracking
- User input (captions, tags)

### Keyboard Shortcuts
- Arrow keys: Navigate between images
- Enter: Crop & Save current image
- Focus management for caption inputs

### Hot Reload
Development mode includes electron-reload for automatic restart on file changes. The `--dev` flag or `ELECTRON_IS_DEV=true` environment variable enables development features.