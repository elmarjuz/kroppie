We already have a UI example with a very solid UX matching the expectations. We only need to convert it to work with real

<example>
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FolderOpen, Save, SkipForward, SkipBack, Scissors, Settings } from 'lucide-react';

const LoRADatasetCropper = () => {
  // State management
  const [sourceDirectory, setSourceDirectory] = useState('');
  const [outputDirectory, setOutputDirectory] = useState('');
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImage, setCurrentImage] = useState(null);
  const [processedImages, setProcessedImages] = useState(new Set());
  const [caption, setCaption] = useState('');
  const [sharedTags, setSharedTags] = useState('');
  
  // Cropping state
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 512, height: 512 });
  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showCropArea, setShowCropArea] = useState(false);
  
  // Refs
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const captionInputRef = useRef(null);
  const containerRef = useRef(null);

  // Simulate file system access (in real Electron app, these would use IPC)
  const selectDirectory = async (type) => {
    // Mock directory selection - in real app would use electron dialog
    const mockPath = type === 'source' ? 'C:\\Images\\Source' : 'C:\\Images\\Output';
    if (type === 'source') {
      setSourceDirectory(mockPath);
      await loadImages(mockPath);
    } else {
      setOutputDirectory(mockPath);
    }
  };

  const loadImages = async (directory) => {
    // Mock image loading - in real app would use fs to read directory
    const mockImages = [
      { name: 'image1.jpg', path: `${directory}\\image1.jpg`, processed: false },
      { name: 'image2.png', path: `${directory}\\image2.png`, processed: false },
      { name: 'image3.jpg', path: `${directory}\\image3.jpg`, processed: false },
      { name: 'image4.png', path: `${directory}\\image4.png`, processed: false },
      { name: 'image5.jpg', path: `${directory}\\image5.jpg`, processed: false }
    ];
    setImages(mockImages);
    setCurrentImageIndex(0);
    if (mockImages.length > 0) {
      await loadCurrentImage(mockImages[0]);
    }
  };

  const loadCurrentImage = async (imageData) => {
    // Mock image loading - in real app would load actual image file
    setCurrentImage(imageData);
    
    // Load existing caption if exists
    const captionPath = imageData.path.replace(/\.[^/.]+$/, '.txt');
    // In real app: const captionText = await fs.readFile(captionPath, 'utf8').catch(() => '');
    setCaption(''); // Mock empty caption
    
    // Calculate image scale and center crop area
    setTimeout(() => {
      if (imageRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const maxWidth = containerRect.width - 40; // padding
        const maxHeight = containerRect.height - 40;
        
        // Mock image dimensions - in real app would get from loaded image
        const imageWidth = 1920;
        const imageHeight = 1080;
        
        const scaleX = maxWidth / imageWidth;
        const scaleY = maxHeight / imageHeight;
        const scale = Math.min(scaleX, scaleY, 1);
        
        setImageScale(scale);
        
        const scaledWidth = imageWidth * scale;
        const scaledHeight = imageHeight * scale;
        
        setImageOffset({
          x: (maxWidth - scaledWidth) / 2,
          y: (maxHeight - scaledHeight) / 2
        });
        
        // Center crop area
        setCropArea({
          x: (scaledWidth - 512 * scale) / 2,
          y: (scaledHeight - 512 * scale) / 2,
          width: 512 * scale,
          height: 512 * scale
        });
        
        setShowCropArea(true);
      }
    }, 100);
    
    // Auto-focus caption input
    setTimeout(() => {
      if (captionInputRef.current) {
        captionInputRef.current.focus();
      }
    }, 200);
  };

  const navigateImage = useCallback((direction) => {
    const newIndex = direction === 'next' 
      ? Math.min(currentImageIndex + 1, images.length - 1)
      : Math.max(currentImageIndex - 1, 0);
    
    if (newIndex !== currentImageIndex) {
      setCurrentImageIndex(newIndex);
      loadCurrentImage(images[newIndex]);
      setShowCropArea(false);
    }
  }, [currentImageIndex, images]);

  const handleMouseDown = (e) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - imageOffset.x;
    const y = e.clientY - rect.top - imageOffset.y;
    
    setIsDragging(true);
    setCropArea({
      x: Math.max(0, x - 256 * imageScale),
      y: Math.max(0, y - 256 * imageScale),
      width: 512 * imageScale,
      height: 512 * imageScale
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - imageOffset.x;
    const y = e.clientY - rect.top - imageOffset.y;
    
    setCropArea({
      x: Math.max(0, x - 256 * imageScale),
      y: Math.max(0, y - 256 * imageScale),
      width: 512 * imageScale,
      height: 512 * imageScale
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const cropAndSave = async () => {
    if (!currentImage || !outputDirectory) return;
    
    // Mock saving process - in real app would use canvas to crop and fs to save
    const outputPath = `${outputDirectory}\\${currentImage.name}`;
    const captionPath = `${outputDirectory}\\${currentImage.name.replace(/\.[^/.]+$/, '.txt')}`;
    
    // Combine caption and shared tags
    const fullCaption = caption + (sharedTags ? `, ${sharedTags}` : '');
    
    console.log('Saving cropped image to:', outputPath);
    console.log('Saving caption:', fullCaption);
    
    // Mark as processed
    const newProcessed = new Set(processedImages);
    newProcessed.add(currentImage.path);
    setProcessedImages(newProcessed);
    
    // Auto-navigate to next unprocessed image
    const nextUnprocessed = images.findIndex((img, index) => 
      index > currentImageIndex && !newProcessed.has(img.path)
    );
    
    if (nextUnprocessed !== -1) {
      setCurrentImageIndex(nextUnprocessed);
      loadCurrentImage(images[nextUnprocessed]);
    } else {
      navigateImage('next');
    }
    
    setShowCropArea(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigateImage('prev');
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateImage('next');
          break;
        case 'Enter':
          e.preventDefault();
          cropAndSave();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateImage]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Directory Controls */}
        <div className="p-4 border-b border-gray-700">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Source Directory</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sourceDirectory}
                  onChange={(e) => setSourceDirectory(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm"
                  placeholder="Select source folder..."
                />
                <button
                  onClick={() => selectDirectory('source')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1"
                >
                  <FolderOpen size={16} />
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Output Directory</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={outputDirectory}
                  onChange={(e) => setOutputDirectory(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm"
                  placeholder="Select output folder..."
                />
                <button
                  onClick={() => selectDirectory('output')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1"
                >
                  <FolderOpen size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium mb-3">Images ({images.length})</h3>
          <div className="space-y-2">
            {images.map((image, index) => (
              <div
                key={image.path}
                onClick={() => {
                  setCurrentImageIndex(index);
                  loadCurrentImage(image);
                  setShowCropArea(false);
                }}
                className={`p-3 rounded cursor-pointer border-2 transition-colors ${
                  index === currentImageIndex
                    ? 'bg-blue-600 border-blue-500'
                    : processedImages.has(image.path)
                    ? 'bg-green-800 border-green-600'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <div className="text-sm font-medium truncate">{image.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {processedImages.has(image.path) ? 'Processed' : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Caption Controls */}
        <div className="p-4 border-t border-gray-700">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Caption</label>
              <textarea
                ref={captionInputRef}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm resize-none"
                rows="3"
                placeholder="Enter image caption..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Shared Tags</label>
              <input
                type="text"
                value={sharedTags}
                onChange={(e) => setSharedTags(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
                placeholder="Tags to append to all images..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateImage('prev')}
              disabled={currentImageIndex === 0}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center gap-2"
            >
              <SkipBack size={16} />
              Previous (←)
            </button>
            
            <span className="text-sm text-gray-300">
              {currentImageIndex + 1} of {images.length}
            </span>
            
            <button
              onClick={() => navigateImage('next')}
              disabled={currentImageIndex === images.length - 1}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center gap-2"
            >
              Next (→)
              <SkipForward size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-300">
              Crop Size: 512×512px
            </div>
            
            <button
              onClick={cropAndSave}
              disabled={!currentImage || !outputDirectory}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center gap-2 font-medium"
            >
              <Scissors size={16} />
              Crop & Save (Enter)
            </button>
          </div>
        </div>

        {/* Image Cropping Area */}
        <div className="flex-1 overflow-hidden" ref={containerRef}>
          {currentImage ? (
            <div className="w-full h-full flex items-center justify-center p-5 relative">
              <div 
                className="relative cursor-crosshair"
                style={{
                  width: 1920 * imageScale,
                  height: 1080 * imageScale,
                  transform: `translate(${imageOffset.x}px, ${imageOffset.y}px)`
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Mock image - in real app this would be an actual img element */}
                <div
                  ref={imageRef}
                  className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />

                {/* Crop Area Overlay */}
                {showCropArea && (
                  <>
                    {/* Darken outside crop area */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none" />
                    
                    {/* Crop selection box */}
                    <div
                      className="absolute border-2 border-yellow-400 bg-transparent pointer-events-none"
                      style={{
                        left: cropArea.x,
                        top: cropArea.y,
                        width: cropArea.width,
                        height: cropArea.height,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {/* Corner indicators */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 border border-yellow-500" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border border-yellow-500" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 border border-yellow-500" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 border border-yellow-500" />
                      
                      {/* Size label */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-medium">
                        512×512
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a source directory to begin</p>
                <p className="text-sm mt-2">Load images and start cropping for your LoRA dataset</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="h-8 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-4 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Processed: {processedImages.size}/{images.length}</span>
            <span>Output: {outputDirectory || 'Not selected'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Scale: {Math.round(imageScale * 100)}%</span>
            <span>Click and drag to position crop area</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoRADatasetCropper;
</example>

