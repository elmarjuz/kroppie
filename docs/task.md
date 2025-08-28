You are tasked with creating a Windows-oriented Electron-based desktop application for cropping images and managing their captions. Follow these instructions carefully to implement the application according to the given requirements.

First, carefully read and analyze the project requirements:

<project_requirements>
{{PROJECT_REQUIREMENTS}}
</project_requirements>

Now, follow these steps to implement the application:

1. Development Environment Setup:
   - Initialize a new Node.js project using `npm init`
   - Install Electron and other necessary dependencies:
     ```
     npm install electron electron-builder --save-dev
     npm install electron-reload --save-dev
     ```

2. Project Structure:
   Create the following directory structure:
   ```
   project-root/
   ├── src/
   │   ├── main.js
   │   ├── preload.js
   │   ├── renderer.js
   │   └── index.html
   ├── styles/
   │   └── main.css
   ├── package.json
   └── .gitignore
   ```

3. Main Application Functionality:
   a. In `main.js`, set up the main process:
      - Create the main window
      - Set up IPC (Inter-Process Communication) handlers for file system operations
      - Implement hot-reloading for development

   b. In `preload.js`, expose necessary APIs to the renderer process:
      - File system operations
      - IPC communication methods

   c. In `renderer.js`, implement the following functions:
      - Load images from the selected directory
      - Display images in the gallery
      - Implement image cropping functionality
      - Handle caption and tag inputs
      - Save cropped images and captions
      - Navigate between images

4. User Interface Design:
   - Agents MUST each see the `kickstart` & `example` sections and review the `./example.md` file for details on UI/UX implementation, use the following points 5-7 as reference to verify current state & mapping to OS logic. UI implementationshould stay the same as in the example.

5. File Handling and Image Processing:
   - Implement functions to read and write image files
   - Create a 512x512px cropping zone that scales correctly with window size
   - Ensure accurate cropping regardless of image size or window dimensions
   - Update placeholders in the UI example to use the new logic

6. Captions and Tags Handling:
   - Create functions to read and write caption files (.txt) alongside images
   - Implement shared tags functionality
   - Auto-focus caption input when navigating to a new image

7. Keyboard Shortcuts:
   Implement the following shortcuts:
   - Arrow keys for image navigation
   - Enter for Crop & Save
   - Other relevant shortcuts for common actions

8. Clean-up & Final steps
   - Clean-up all mock functionality and any redundant left-over logic
   - Ensure that application runs & hot-reloads as expected
   - Make up a `summary` & update README with details on implementation, all discrete parts - concise but with clear technical detail

After implementing the application, provide a summary of your work in the following format:

<summary>
1. Project Structure: Briefly describe the final project structure and main files.
2. Key Features: List the main features implemented in the application.
3. Technologies Used: Mention the primary technologies and libraries used.
4. Challenges and Solutions: Discuss any significant challenges faced during development and how they were resolved.
5. Future Improvements: Suggest potential enhancements or optimizations for the application.
</summary>

Your final output should only include the summary within the <summary> tags. Do not include any code snippets, implementation details, or other information outside of the summary.

<kickstart>
To set you off here's a functioning UI version described with suggestions on Electron-specific improvements - please use `./example.md` as the UI. With this help the main task becomes about correctly structuring the project and connecting the correct OS APIs instead of placeholders.

Directory Management: Source and output folder selection with file system integration points
Image Gallery: Sidebar showing all images with processing status (pending/processed)
Precise Cropping: 512×512 pixel crop area with accurate scaling and positioning
Caption Management: Individual captions + shared tags system
Auto-Navigation: Automatically moves to next unprocessed image after cropping

### User Experience

Keyboard Shortcuts: Arrow keys (navigation), Enter (crop & save)
Visual Feedback: Yellow crop overlay with corner indicators and size label
Auto-Focus: Caption input automatically focuses when navigating images
Progress Tracking: Visual indicators for processed vs pending images

Technical Implementation

Accurate Scaling: Direct mathematical scaling without CSS dependencies
Real-time Crop Preview: Live updating crop area with mouse interaction
State Management: Proper React state handling for complex UI interactions
Responsive Design: Adapts to window size changes while maintaining accuracy

For Full Electron Implementation:
Package.json Setup
json```{
  "name": "croppie",
  "main": "public/electron.js",
  "scripts": {
    "electron": "electron .",
    "electron-dev": "ELECTRON_IS_DEV=true electron .",
    "build": "npm run build && electron-builder"
  },
  "devDependencies": {
    "electron": "latest",
    "electron-builder": "latest",
    "concurrently": "latest"
  }
}
```
File System Integration Points
The app includes placeholder functions that need IPC integration:
```
selectDirectory() → Use dialog.showOpenDialog()
loadImages() → Use fs.readdir() with image filtering
loadCurrentImage() → Use fs.readFile() for captions
cropAndSave() → Use Canvas API + fs.writeFile()
```

Hot Reload Setup

javascript```// In main process
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}
```

The application is architected for easy extension and maintains clean separation between UI components and file operations, making it perfect for professional LoRA dataset preparation workflows.
</kickstart> 

<example>
Please review the ./example.md file as primary reference as to how to implement the application UI. The final apps UI should match this solution.
</example>