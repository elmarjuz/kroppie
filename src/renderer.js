// Application State
class KroppieApp {
    constructor() {
        // Crop dimension settings (will be configurable later)
        this.cropSettings = {
            width: 512,
            height: 512
        };

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
            captionHistory: [], // Array of {caption, tags, timestamp, id} objects
            historyLength: 50, // Maximum number of history items
            isHistoryPinned: false,
            cropArea: { x: 0, y: 0, width: 0, height: 0 }, // Will be set dynamically
            imageScale: 1,
            imageZoomFactor: 1, // New: Image resize factor (0-1, where 1 = original scale)
            imageOffset: { x: 0, y: 0 },
            isDragging: false,
            showCropArea: false,
            actualImageDimensions: { width: 0, height: 0 }
        };

        this.elements = this.initializeElements();
        this.bindEvents();
        this.loadPersistedState();
        this.updateUI();
    }

    loadPersistedState() {
        try {
            // Load directories
            const savedSourceDir = localStorage.getItem('kroppie_sourceDirectory');
            const savedOutputDir = localStorage.getItem('kroppie_outputDirectory');
            const savedSharedTags = localStorage.getItem('kroppie_sharedTags');
            const savedHistory = localStorage.getItem('kroppie_captionHistory');
            const savedHistoryLength = localStorage.getItem('kroppie_historyLength');
            const savedCropSettings = localStorage.getItem('kroppie_cropSettings');

            if (savedSourceDir) {
                this.state.sourceDirectory = savedSourceDir;
                this.elements.sourceDirectory.value = savedSourceDir;
            }

            if (savedOutputDir) {
                this.state.outputDirectory = savedOutputDir;
                this.elements.outputDirectory.value = savedOutputDir;
            }

            if (savedSharedTags) {
                this.state.sharedTags = savedSharedTags;
                this.elements.sharedTags.value = savedSharedTags;
            }

            if (savedHistory) {
                this.state.captionHistory = JSON.parse(savedHistory);
                this.renderHistoryList();
            }

            if (savedHistoryLength) {
                this.state.historyLength = parseInt(savedHistoryLength);
                this.elements.historyLengthInput.value = this.state.historyLength;
            }

            if (savedCropSettings) {
                const cropSettings = JSON.parse(savedCropSettings);
                this.cropSettings.width = cropSettings.width || 512;
                this.cropSettings.height = cropSettings.height || 512;
                this.elements.cropWidthInput.value = this.cropSettings.width;
                this.elements.cropHeightInput.value = this.cropSettings.height;
            }

            // Auto-load images if source directory exists
            if (savedSourceDir) {
                this.loadImages(savedSourceDir);
            }
        } catch (error) {
            console.error('Error loading persisted state:', error);
        }
    }

    savePersistedState() {
        try {
            localStorage.setItem('kroppie_sourceDirectory', this.state.sourceDirectory || '');
            localStorage.setItem('kroppie_outputDirectory', this.state.outputDirectory || '');
            localStorage.setItem('kroppie_sharedTags', this.state.sharedTags || '');
            localStorage.setItem('kroppie_captionHistory', JSON.stringify(this.state.captionHistory));
            localStorage.setItem('kroppie_historyLength', this.state.historyLength.toString());
            localStorage.setItem('kroppie_cropSettings', JSON.stringify(this.cropSettings));
            this.renderHistoryList();
        } catch (error) {
            console.error('Error saving persisted state:', error);
        }
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
            scaleStatus: document.getElementById('scaleStatus'),
            cropSizeLabel: document.getElementById('cropSizeLabel'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            historyLengthInput: document.getElementById('historyLengthInput'),
            historyDropdown: document.getElementById('historyDropdown'),
            historySearch: document.getElementById('historySearch'),
            historyList: document.getElementById('historyList'),
            imageZoomSlider: document.getElementById('imageZoomSlider'),
            zoomPercentage: document.getElementById('zoomPercentage'),
            cropWidthInput: document.getElementById('cropWidthInput'),
            cropHeightInput: document.getElementById('cropHeightInput')
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
            this.savePersistedState();
        });

        // Mouse events for cropping
        this.elements.imageWrapper.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.elements.imageWrapper.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.elements.imageWrapper.addEventListener('mouseup', () => this.handleMouseUp());
        this.elements.imageWrapper.addEventListener('mouseleave', () => this.handleMouseUp());

        // Settings and history events
        this.elements.settingsBtn.addEventListener('click', () => this.openSettingsModal());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.elements.historySearch.addEventListener('input', (e) => this.filterHistory(e.target.value));

        // Image zoom slider event
        this.elements.imageZoomSlider.addEventListener('input', (e) => this.handleZoomChange(e.target.value));

        // Crop dimension inputs
        this.elements.cropWidthInput.addEventListener('input', (e) => this.handleCropDimensionChange());
        this.elements.cropHeightInput.addEventListener('input', (e) => this.handleCropDimensionChange());

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => this.handleDocumentClick(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Window resize
        window.addEventListener('resize', () => this.recalculateImageLayout());

        // Image load event
        this.elements.currentImage.addEventListener('load', () => this.onImageLoad());
    }

    // Settings Modal Methods
    openSettingsModal() {
        this.elements.settingsModal.style.display = 'flex';
        this.elements.historyLengthInput.value = this.state.historyLength;
    }

    closeSettingsModal() {
        this.elements.settingsModal.style.display = 'none';
    }

    saveSettings() {
        const newLength = parseInt(this.elements.historyLengthInput.value);
        if (newLength >= 10 && newLength <= 500) {
            this.state.historyLength = newLength;

            // Trim history if needed
            if (this.state.captionHistory.length > newLength) {
                this.state.captionHistory = this.state.captionHistory.slice(0, newLength);
            }

            this.savePersistedState();
            this.renderHistoryList();
        }
        this.closeSettingsModal();
    }

    handleZoomChange(value) {
        if (!this.state.currentImage) return;

        // Convert slider value (0-100) to zoom factor
        // 0 = minimum zoom (crop fits in image), 100 = original size
        const percentage = parseInt(value) / 100;

        const { width: imageWidth, height: imageHeight } = this.state.actualImageDimensions;

        // Calculate minimum zoom to fit crop area in image (consider both dimensions)
        const minZoomX = this.cropSettings.width / imageWidth;
        const minZoomY = this.cropSettings.height / imageHeight;
        const minZoom = Math.max(minZoomX, minZoomY); // Use the larger constraint

        // Calculate zoom factor: interpolate between minZoom and 1.0
        this.state.imageZoomFactor = minZoom + (1 - minZoom) * percentage;

        // Update zoom percentage display
        this.elements.zoomPercentage.textContent = `${value}%`;

        // Recalculate layout with new zoom
        this.recalculateImageLayout();
    }

    handleCropDimensionChange() {
        const width = parseInt(this.elements.cropWidthInput.value);
        const height = parseInt(this.elements.cropHeightInput.value);

        // Validate inputs
        if (!width || width < 64 || width > 2048 || !height || height < 64 || height > 2048) {
            return;
        }

        // Update crop settings
        this.cropSettings.width = width;
        this.cropSettings.height = height;

        // Save to localStorage
        this.savePersistedState();

        // If we have an image loaded, recalculate layout and reset zoom
        if (this.state.currentImage) {
            // Reset zoom to 100% when crop dimensions change
            this.elements.imageZoomSlider.value = 100;
            this.state.imageZoomFactor = 1;
            this.elements.zoomPercentage.textContent = '100%';

            this.recalculateImageLayout();
        }

        this.updateUI();
    }

    handleDocumentClick(e) {
        // Close settings modal if clicking outside
        if (e.target === this.elements.settingsModal) {
            this.closeSettingsModal();
        }
    }

    addToHistory(caption, tags) {
        const combinedText = `${caption.trim()} ${tags.trim()}`.trim();
        if (!combinedText) return;

        const timestamp = new Date().toISOString();

        // Check if this exact combination already exists
        const existingIndex = this.state.captionHistory.findIndex(item =>
            `${item.caption.trim()} ${item.tags.trim()}`.trim() === combinedText
        );

        if (existingIndex >= 0) {
            // Update timestamp and move to front
            const existing = this.state.captionHistory.splice(existingIndex, 1)[0];
            existing.timestamp = timestamp;
            this.state.captionHistory.unshift(existing);
        } else {
            // Add new entry
            const newEntry = {
                id: Date.now().toString(),
                caption: caption.trim(),
                tags: tags.trim(),
                timestamp: timestamp
            };

            this.state.captionHistory.unshift(newEntry);

            // Trim to max length
            if (this.state.captionHistory.length > this.state.historyLength) {
                this.state.captionHistory = this.state.captionHistory.slice(0, this.state.historyLength);
            }
        }

        this.savePersistedState();
    }

    deleteHistoryItem(id) {
        this.state.captionHistory = this.state.captionHistory.filter(item => item.id !== id);
        this.savePersistedState();
        this.renderHistoryList();
    }

    selectHistoryItem(id) {
        const item = this.state.captionHistory.find(h => h.id === id);
        if (item) {
            this.state.caption = item.caption;
            this.state.sharedTags = item.tags;
            this.elements.captionInput.value = item.caption;
            this.elements.sharedTags.value = item.tags;
            this.elements.historyDropdown.style.display = 'none';
            this.savePersistedState();
        }
    }

    filterHistory(searchTerm) {
        this.renderHistoryList(searchTerm.toLowerCase());
    }

    renderHistoryList(filterText = '') {
        const container = this.elements.historyList;

        let filteredHistory = this.state.captionHistory;
        const noHistory = filteredHistory.length === 0;
        if (filterText) {
            filteredHistory = this.state.captionHistory.filter(item => {
                const searchText = `${item.caption} ${item.tags}`.toLowerCase();
                return searchText.includes(filterText);
            });
        }

        if (noHistory) {
            this.elements.historyDropdown.style.display = "none";
            return;
        } else {

            this.elements.historyDropdown.style.display = "block";
        }

        container.innerHTML = filteredHistory.map(item => {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Condensed content preview (max 60 chars)
            const contentPreview = item.caption.length > 60 ?
                item.caption.substring(0, 57) + '...' :
                item.caption;

            return `
                <div class="history-item"  data-tooltip="${item.caption}; ${item.tags}" data-id="${item.id}"> 
                    <div class="history-time">${timeStr}</div>
                    ${item.tags ? `<div class="history-tags">${item.tags}</div>` : ''}
                    <div class="history-content">${contentPreview}</div>
                    <div class="history-actions">
                        <button class="delete-history" data-id="${item.id}">×</button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for history items
        container.querySelectorAll('.history-item').forEach(item => {
            const id = item.dataset.id;
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-history')) {
                    this.selectHistoryItem(id);
                }
            });
        });

        // Add event listeners for delete buttons
        container.querySelectorAll('.delete-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteHistoryItem(btn.dataset.id);
            });
        });
    }

    async selectDirectory(type) {
        try {
            const selectedPath = await window.electronAPI.selectDirectory(type);
            if (selectedPath) {
                if (type === 'source') {
                    this.state.sourceDirectory = selectedPath;
                    this.elements.sourceDirectory.value = selectedPath;
                    this.savePersistedState();
                    await this.loadImages(selectedPath);
                } else {
                    this.state.outputDirectory = selectedPath;
                    this.elements.outputDirectory.value = selectedPath;
                    this.savePersistedState();
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
                this.savePersistedState();
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

        // Enable zoom slider and reset to 100%
        this.elements.imageZoomSlider.disabled = false;
        this.elements.imageZoomSlider.value = 100;
        this.state.imageZoomFactor = 1;
        this.elements.zoomPercentage.textContent = '100%';

        // Calculate image layout and crop area
        this.recalculateImageLayout();
    }

    recalculateImageLayout() {
        if (!this.state.currentImage) return;

        const containerRect = this.elements.imageContainer.getBoundingClientRect();
        const maxWidth = containerRect.width - 40; // padding
        const maxHeight = containerRect.height - 40;

        const { width: imageWidth, height: imageHeight } = this.state.actualImageDimensions;

        // Apply image zoom factor first (resize the effective image size)
        const zoomedWidth = imageWidth * this.state.imageZoomFactor;
        const zoomedHeight = imageHeight * this.state.imageZoomFactor;

        // Then calculate display scale to fit in container
        const scaleX = maxWidth / zoomedWidth;
        const scaleY = maxHeight / zoomedHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        this.state.imageScale = scale;

        const scaledWidth = zoomedWidth * scale;
        const scaledHeight = zoomedHeight * scale;

        // Update image element size
        this.elements.currentImage.style.width = `${scaledWidth}px`;
        this.elements.currentImage.style.height = `${scaledHeight}px`;

        // Center crop area using actual crop settings
        const cropWidth = this.cropSettings.width * scale;
        const cropHeight = this.cropSettings.height * scale;
        this.state.cropArea = {
            x: (scaledWidth - cropWidth) / 2,
            y: (scaledHeight - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight
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

        const cropWidth = this.cropSettings.width * this.state.imageScale;
        const cropHeight = this.cropSettings.height * this.state.imageScale;
        this.state.cropArea = {
            x: Math.max(0, Math.min(x - cropWidth / 2, this.elements.currentImage.offsetWidth - cropWidth)),
            y: Math.max(0, Math.min(y - cropHeight / 2, this.elements.currentImage.offsetHeight - cropHeight)),
            width: cropWidth,
            height: cropHeight
        };

        this.updateCropOverlay();
    }

    handleMouseMove(e) {
        if (!this.state.isDragging || !this.state.currentImage) return;

        const rect = this.elements.imageWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cropWidth = this.cropSettings.width * this.state.imageScale;
        const cropHeight = this.cropSettings.height * this.state.imageScale;
        this.state.cropArea = {
            x: Math.max(0, Math.min(x - cropWidth / 2, this.elements.currentImage.offsetWidth - cropWidth)),
            y: Math.max(0, Math.min(y - cropHeight / 2, this.elements.currentImage.offsetHeight - cropHeight)),
            width: cropWidth,
            height: cropHeight
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
        const sizeLabel = `${this.cropSettings.width}×${this.cropSettings.height}`;
        ctx.fillText(sizeLabel, x + width / 2, y - 10);
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
            canvas.width = this.cropSettings.width;
            canvas.height = this.cropSettings.height;
            const ctx = canvas.getContext('2d');

            // Calculate source coordinates in original image
            // Account for image zoom factor in the calculation
            const effectiveImageWidth = this.state.actualImageDimensions.width * this.state.imageZoomFactor;
            const effectiveImageHeight = this.state.actualImageDimensions.height * this.state.imageZoomFactor;
            const scaleRatio = effectiveImageWidth / this.elements.currentImage.offsetWidth;
            const sourceX = this.state.cropArea.x * scaleRatio;
            const sourceY = this.state.cropArea.y * scaleRatio;
            const sourceCropWidth = this.cropSettings.width * this.state.imageScale * scaleRatio;
            const sourceCropHeight = this.cropSettings.height * this.state.imageScale * scaleRatio;

            // Draw cropped image
            const img = this.elements.currentImage;
            ctx.drawImage(img, sourceX, sourceY, sourceCropWidth, sourceCropHeight, 0, 0, this.cropSettings.width, this.cropSettings.height);

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

                // Add to caption history
                this.addToHistory(this.state.caption, this.state.sharedTags);

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
                    <div><img src="file://${image.path}"></div>
                    <div>
                        <div class="image-name">${image.name}</div> 
                        <div class="image-status">${this.state.processedImages.has(image.path) ? 'Processed' : 'Pending'}</div>
                    </div>
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

        // Update crop size label
        this.elements.cropSizeLabel.textContent = `Crop Size: ${this.cropSettings.width}×${this.cropSettings.height}px`;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KroppieApp();
});