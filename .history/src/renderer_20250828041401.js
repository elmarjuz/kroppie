// Application State
class KroppieApp {
    constructor() {
        this.state = {
            sourceDirectory: '',
            outputDirectory: '',
            images: [],
            currentImageIndex: 0,
            currentImage: null,
            processedImages: new Set(),
            caption: '',
            sharedTags: '',
            cropCounter: new Map(), // Track crop count per image
            cropArea: { x: 0, y: 0, width: 512, height: 512 },
            imageScale: 1,
            imageOffset: { x: 0, y: 0 },
            isDragging: false,
            showCropArea: false,
            actualImageDimensions: { width: 0, height: 0 }
        };

        this.elements = this.initializeElements();
        this.bindEvents();
        this.updateUI();
    }

    initializeElements() {
        return {
            sourceDirectory: document.getElementById('sourceDirectory'),
            outputDirectory: document.getElementById('outputDirectory'),
            selectSourceBtn: document.getElementById('selectSourceBtn'),
            selectOutputBtn: document.getElementById('selectOutputBtn'),
            imageCount: document.getElementById('imageCount'),
            imageList: document.getElementById('imageList'),
            captionInput: document.getElementById('captionInput'),
            sharedTags: document.getElementById('sharedTags'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            imageCounter: document.getElementById('imageCounter'),
            cropSaveBtn: document.getElementById('cropSaveBtn'),
            cropNextBtn: document.getElementById('cropNextBtn'),
            imageContainer: document.getElementById('imageContainer'),
            noImageState: document.getElementById('noImageState'),
            imageWorkspace: document.getElementById('imageWorkspace'),
            currentImage: document.getElementById('currentImage'),
            imageWrapper: document.getElementById('imageWrapper'),
            cropOverlay: document.getElementById('cropOverlay'),
            processedCount: document.getElementById('processedCount'),
            outputStatus: document.getElementById('outputStatus'),
            scaleStatus: document.getElementById('scaleStatus')
        };
    }

    bindEvents() {
        // Directory selection
        this.elements.selectSourceBtn.addEventListener('click', () => this.selectDirectory('source'));
        this.elements.selectOutputBtn.addEventListener('click', () => this.selectDirectory('output'));

        // Navigation
        this.elements.prevBtn.addEventListener('click', () => this.navigateImage('prev'));
        this.elements.nextBtn.addEventListener('click', () => this.navigateImage('next'));

        // Crop and save
        this.elements.cropSaveBtn.addEventListener('click', () => this.cropAndSave());
        this.elements.cropNextBtn.addEventListener('click', () => this.cropAndNext());

        // Caption handling
        this.elements.captionInput.addEventListener('input', (e) => {
            this.state.caption = e.target.value;
        });

        this.elements.sharedTags.addEventListener('input', (e) => {
            this.state.sharedTags = e.target.value;
        });

        // Mouse events for cropping
        this.elements.imageWrapper.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.elements.imageWrapper.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.elements.imageWrapper.addEventListener('mouseup', () => this.handleMouseUp());
        this.elements.imageWrapper.addEventListener('mouseleave', () => this.handleMouseUp());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Window resize
        window.addEventListener('resize', () => this.recalculateImageLayout());

        // Image load event
        this.elements.currentImage.addEventListener('load', () => this.onImageLoad());
    }

    async selectDirectory(type) {
        try {
            const selectedPath = await window.electronAPI.selectDirectory(type);
            if (selectedPath) {
                if (type === 'source') {
                    this.state.sourceDirectory = selectedPath;
                    this.elements.sourceDirectory.value = selectedPath;
                    await this.loadImages(selectedPath);
                } else {
                    this.state.outputDirectory = selectedPath;
                    this.elements.outputDirectory.value = selectedPath;
                }
                this.updateUI();
            }
        } catch (error) {
            console.error('Error selecting directory:', error);
        }
    }

    async loadImages(directory) {
        try {
            const images = await window.electronAPI.loadImages(directory);
            this.state.images = images;
            this.state.currentImageIndex = 0;
            this.state.processedImages.clear();
            
            // Set default output directory if not already set
            if (!this.state.outputDirectory) {
                this.state.outputDirectory = await window.electronAPI.joinPath(directory, 'output');
                this.elements.outputDirectory.value = this.state.outputDirectory;
            }
            
            if (images.length > 0) {
                await this.loadCurrentImage(images[0]);
            }
            
            this.renderImageList();
            this.updateUI();
        } catch (error) {
            console.error('Error loading images:', error);
        }
    }

    async loadCurrentImage(imageData) {
        try {
            this.state.currentImage = imageData;
            
            // Load image dimensions
            this.state.actualImageDimensions = await window.electronAPI.getImageDimensions(imageData.path);
            
            // Set image source
            this.elements.currentImage.src = `file://${imageData.path}`;
            
            // Load existing caption
            const caption = await window.electronAPI.loadCaption(imageData.path);
            this.state.caption = caption;
            this.elements.captionInput.value = caption;
            
            // Auto-focus caption input
            setTimeout(() => {
                this.elements.captionInput.focus();
            }, 100);
            
        } catch (error) {
            console.error('Error loading current image:', error);
        }
    }

    onImageLoad() {
        // Show image workspace, hide no-image state
        this.elements.noImageState.style.display = 'none';
        this.elements.imageWorkspace.style.display = 'flex';
        
        // Calculate image layout and crop area
        this.recalculateImageLayout();
    }

    recalculateImageLayout() {
        if (!this.state.currentImage) return;

        const containerRect = this.elements.imageContainer.getBoundingClientRect();
        const maxWidth = containerRect.width - 40; // padding
        const maxHeight = containerRect.height - 40;
        
        const { width: imageWidth, height: imageHeight } = this.state.actualImageDimensions;
        
        const scaleX = maxWidth / imageWidth;
        const scaleY = maxHeight / imageHeight;
        const scale = Math.min(scaleX, scaleY, 1);
        
        this.state.imageScale = scale;
        
        const scaledWidth = imageWidth * scale;
        const scaledHeight = imageHeight * scale;
        
        // Update image element size
        this.elements.currentImage.style.width = `${scaledWidth}px`;
        this.elements.currentImage.style.height = `${scaledHeight}px`;
        
        // Center crop area
        const cropSize = 512 * scale;
        this.state.cropArea = {
            x: (scaledWidth - cropSize) / 2,
            y: (scaledHeight - cropSize) / 2,
            width: cropSize,
            height: cropSize
        };
        
        this.state.showCropArea = true;
        this.updateCropOverlay();
        this.updateUI();
    }

    handleMouseDown(e) {
        if (!this.state.currentImage) return;
        
        const rect = this.elements.imageWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.state.isDragging = true;
        
        const cropSize = 512 * this.state.imageScale;
        this.state.cropArea = {
            x: Math.max(0, Math.min(x - cropSize / 2, this.elements.currentImage.offsetWidth - cropSize)),
            y: Math.max(0, Math.min(y - cropSize / 2, this.elements.currentImage.offsetHeight - cropSize)),
            width: cropSize,
            height: cropSize
        };
        
        this.updateCropOverlay();
    }

    handleMouseMove(e) {
        if (!this.state.isDragging || !this.state.currentImage) return;
        
        const rect = this.elements.imageWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const cropSize = 512 * this.state.imageScale;
        this.state.cropArea = {
            x: Math.max(0, Math.min(x - cropSize / 2, this.elements.currentImage.offsetWidth - cropSize)),
            y: Math.max(0, Math.min(y - cropSize / 2, this.elements.currentImage.offsetHeight - cropSize)),
            width: cropSize,
            height: cropSize
        };
        
        this.updateCropOverlay();
    }

    handleMouseUp() {
        this.state.isDragging = false;
    }

    updateCropOverlay() {
        if (!this.state.showCropArea) return;

        const canvas = this.elements.cropOverlay;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match image
        const imgWidth = this.elements.currentImage.offsetWidth;
        const imgHeight = this.elements.currentImage.offsetHeight;
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        canvas.style.width = `${imgWidth}px`;
        canvas.style.height = `${imgHeight}px`;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Clear crop area
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(this.state.cropArea.x, this.state.cropArea.y, this.state.cropArea.width, this.state.cropArea.height);
        
        // Draw crop border
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.state.cropArea.x, this.state.cropArea.y, this.state.cropArea.width, this.state.cropArea.height);
        
        // Draw corner indicators
        const cornerSize = 6;
        ctx.fillStyle = '#fbbf24';
        const { x, y, width, height } = this.state.cropArea;
        
        // Top-left
        ctx.fillRect(x - cornerSize / 2, y - cornerSize / 2, cornerSize, cornerSize);
        // Top-right
        ctx.fillRect(x + width - cornerSize / 2, y - cornerSize / 2, cornerSize, cornerSize);
        // Bottom-left
        ctx.fillRect(x - cornerSize / 2, y + height - cornerSize / 2, cornerSize, cornerSize);
        // Bottom-right
        ctx.fillRect(x + width - cornerSize / 2, y + height - cornerSize / 2, cornerSize, cornerSize);
        
        // Draw size label
        ctx.fillStyle = '#fbbf24';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('512×512', x + width / 2, y - 10);
    }

    navigateImage(direction) {
        const newIndex = direction === 'next' 
            ? Math.min(this.state.currentImageIndex + 1, this.state.images.length - 1)
            : Math.max(this.state.currentImageIndex - 1, 0);
        
        if (newIndex !== this.state.currentImageIndex) {
            this.state.currentImageIndex = newIndex;
            this.loadCurrentImage(this.state.images[newIndex]);
            this.state.showCropArea = false;
            this.renderImageList();
        }
    }

    async cropAndSave() {
        await this.performCrop(false); // Don't navigate after saving
    }

    async cropAndNext() {
        await this.performCrop(true); // Navigate after saving
    }

    async performCrop(navigateNext = false) {
        if (!this.state.currentImage) return;
        
        // Ensure we have an output directory
        let outputDir = this.state.outputDirectory;
        if (!outputDir) {
            outputDir = await window.electronAPI.joinPath(this.state.sourceDirectory, 'output');
            this.state.outputDirectory = outputDir;
            this.elements.outputDirectory.value = outputDir;
        }
        
        // Create output directory if it doesn't exist
        await window.electronAPI.ensureDirectory(outputDir);
        
        try {
            // Create canvas for cropping
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Calculate source coordinates in original image
            const scaleRatio = this.state.actualImageDimensions.width / this.elements.currentImage.offsetWidth;
            const sourceX = this.state.cropArea.x * scaleRatio;
            const sourceY = this.state.cropArea.y * scaleRatio;
            const sourceSize = 512 * this.state.imageScale * scaleRatio;
            
            // Draw cropped image
            const img = this.elements.currentImage;
            ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 512, 512);
            
            // Convert to blob
            canvas.toBlob(async (blob) => {
                const arrayBuffer = await blob.arrayBuffer();
                const buffer = new Uint8Array(arrayBuffer);
                
                // Generate unique filename for multiple crops
                const imageName = this.state.currentImage.name;
                const cropCount = this.state.cropCounter.get(this.state.currentImage.path) || 0;
                const newCropCount = cropCount + 1;
                this.state.cropCounter.set(this.state.currentImage.path, newCropCount);
                
                // Create unique filename: image_crop1.jpg, image_crop2.jpg, etc.
                const nameWithoutExt = imageName.replace(/\.[^/.]+$/, '');
                const extension = imageName.match(/\.[^/.]+$/)?.[0] || '.jpg';
                const uniqueName = newCropCount === 1 ? imageName : `${nameWithoutExt}_crop${newCropCount}${extension}`;
                
                const outputPath = await window.electronAPI.joinPath(outputDir, uniqueName);
                
                // Save cropped image
                await window.electronAPI.saveCroppedImage({
                    sourcePath: this.state.currentImage.path,
                    outputPath: outputPath,
                    cropData: this.state.cropArea,
                    imageBuffer: buffer
                });
                
                // Save caption
                const fullCaption = this.state.caption + (this.state.sharedTags ? `, ${this.state.sharedTags}` : '');
                await window.electronAPI.saveCaption(outputPath, fullCaption);
                
                // Mark as processed (for navigation purposes)
                this.state.processedImages.add(this.state.currentImage.path);
                
                if (navigateNext) {
                    // Auto-navigate to next unprocessed image
                    const nextUnprocessed = this.state.images.findIndex((img, index) => 
                        index > this.state.currentImageIndex && !this.state.processedImages.has(img.path)
                    );
                    
                    if (nextUnprocessed !== -1) {
                        this.state.currentImageIndex = nextUnprocessed;
                        await this.loadCurrentImage(this.state.images[nextUnprocessed]);
                        this.state.showCropArea = false;
                    } else {
                        this.navigateImage('next');
                        this.state.showCropArea = false;
                    }
                }
                
                this.renderImageList();
                this.updateUI();
                
            }, 'image/jpeg', 0.95);
            
        } catch (error) {
            console.error('Error cropping and saving:', error);
        }
    }

    handleKeyDown(e) {
        // Global shortcuts that work anywhere in the app
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.cropAndSave();
            return;
        }
        
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            this.cropAndNext();
            return;
        }
        
        // Navigation shortcuts (only when not in input fields)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.navigateImage('prev');
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.navigateImage('next');
                break;
        }
    }

    renderImageList() {
        const container = this.elements.imageList;
        container.innerHTML = '';
        
        this.state.images.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'image-item';
            
            if (index === this.state.currentImageIndex) {
                item.classList.add('current');
            }
            
            if (this.state.processedImages.has(image.path)) {
                item.classList.add('processed');
            }
            
            item.innerHTML = `
                <div class="image-wrap">
                    <img src="file://${imageData.path}" >
                    <div class="image-name">${image.name}</div>
                    <div class="image-status">${this.state.processedImages.has(image.path) ? 'Processed' : 'Pending'}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.state.currentImageIndex = index;
                this.loadCurrentImage(image);
                this.state.showCropArea = false;
                this.renderImageList();
            });
            
            container.appendChild(item);
        });
    }

    updateUI() {
        // Update image count
        this.elements.imageCount.textContent = `Images (${this.state.images.length})`;
        
        // Update image counter
        this.elements.imageCounter.textContent = `${this.state.currentImageIndex + 1} of ${this.state.images.length}`;
        
        // Update navigation buttons
        this.elements.prevBtn.disabled = this.state.currentImageIndex === 0;
        this.elements.nextBtn.disabled = this.state.currentImageIndex === this.state.images.length - 1;
        
        // Update crop buttons - only require current image
        const canCrop = !!this.state.currentImage;
        this.elements.cropSaveBtn.disabled = !canCrop;
        this.elements.cropNextBtn.disabled = !canCrop;
        
        // Update processed count
        this.elements.processedCount.textContent = `Processed: ${this.state.processedImages.size}/${this.state.images.length}`;
        
        // Update output status
        this.elements.outputStatus.textContent = `Output: ${this.state.outputDirectory || 'Not selected'}`;
        
        // Update scale status
        this.elements.scaleStatus.textContent = `Scale: ${Math.round(this.state.imageScale * 100)}%`;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KroppieApp();
});