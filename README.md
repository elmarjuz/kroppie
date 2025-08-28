# Kroppie - LoRA Dataset Cropper

An Electron-based desktop application for cropping images and managing captions for LoRA dataset preparation.

## Features

- **Directory Management**: Select source and output folders with native OS dialogs
- **Image Gallery**: Sidebar showing all images with processing status (pending/processed)
- **Precise Cropping**: 512×512 pixel crop area with accurate scaling and positioning
- **Caption Management**: Individual captions + shared tags system
- **Auto-Navigation**: Automatically moves to next unprocessed image after cropping
- **Keyboard Shortcuts**: Arrow keys for navigation, Enter for crop & save
- **Visual Feedback**: Yellow crop overlay with corner indicators and size label
- **Progress Tracking**: Visual indicators for processed vs pending images

## Installation & Setup

1. Clone or download the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development
Start the application in development mode with hot-reload:
```bash
npm run dev
```

### Production
Start the application:
```bash
npm start
```

### Build for Distribution
Create distributable packages:
```bash
npm run build
```

## How to Use

1. **Select Directories**: Choose your source folder containing images and an output folder for cropped images
2. **Load Images**: The application will automatically load all supported image formats (jpg, png, bmp, gif, webp)
3. **Navigate**: Use arrow keys or click on images in the sidebar to navigate
4. **Add Captions**: Enter individual captions for each image, plus shared tags that apply to all images
5. **Position Crop Area**: Click and drag on the image to position the 512×512 crop area
6. **Crop & Save**: Press Enter or click the "Crop & Save" button to process the image
7. **Auto-Navigate**: The app automatically moves to the next unprocessed image

## Keyboard Shortcuts

- **←/→ Arrow Keys**: Navigate between images
- **Enter**: Crop & Save current image
- **Tab**: Navigate between input fields

## Technical Details

Built with:
- **Electron**: Desktop application framework
- **Canvas API**: Image processing and cropping
- **Native File System**: Directory and file operations
- **Vanilla HTML/CSS/JS**: No external UI frameworks

The application maintains clean separation between UI components and file operations, making it perfect for professional LoRA dataset preparation workflows.