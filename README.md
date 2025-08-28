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
- **Session Persistence**: Remembers your source/output directories and shared tags between sessions

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

1. **Select Source Directory**: Choose your folder containing images. The output directory will automatically be set to `[source]/output` unless specified otherwise
2. **Load Images**: The application will automatically load all supported image formats (jpg, png, bmp, gif, webp)
3. **Navigate**: Use arrow keys or click on images in the sidebar to navigate
4. **Add Captions**: Enter individual captions for each image, plus shared tags that apply to all images
5. **Position Crop Area**: Click and drag on the image to position the 512×512 crop area
6. **Crop & Save**: Use Ctrl+S to save the current crop (stays on image for multiple crops) or Ctrl+N to crop and move to next image
7. **Multiple Crops**: You can create multiple crops from the same image - they'll be saved with unique names (image.jpg, image_crop2.jpg, etc.)

## Keyboard Shortcuts

- **←/→ Arrow Keys**: Navigate between images
- **Ctrl+S**: Crop & Save current image (stays on current image for multiple crops)
- **Ctrl+N**: Crop & Next (saves crop and moves to next image)
- **Tab**: Navigate between input fields

## Technical Details

Built with:
- **Electron**: Desktop application framework
- **Canvas API**: Image processing and cropping
- **Native File System**: Directory and file operations
- **Vanilla HTML/CSS/JS**: No external UI frameworks

The application maintains clean separation between UI components and file operations, making it perfect for professional LoRA dataset preparation workflows.