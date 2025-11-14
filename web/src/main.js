import { BrowserFileHandler } from './file-handler.js';
import { BrowserConsole } from './console-ui.js';
import { BrowserStyleConverter } from './browser-converter.js';
import { saveAs } from 'file-saver';

/**
 * Main application controller
 */
class App {
    constructor() {
        this.fileHandler = new BrowserFileHandler();
        this.console = new BrowserConsole('#console-output');
        this.converter = null;
        this.filesMap = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        // Folder input
        document.getElementById('dirInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files, 'folder');
        });

        // ZIP file input
        document.getElementById('zipInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files, 'zip');
        });

        // Convert button
        document.getElementById('convertBtn').addEventListener('click', () => {
            this.convert();
        });
    }

    showWelcomeMessage() {
        this.console.info('Welcome to eXeLearning Style Converter v2.9 → v3.0');
        this.console.info('Please upload your old style folder or ZIP file to begin...');
        this.console.separator();
    }

    async handleFileUpload(files, type) {
        if (!files || files.length === 0) {
            return;
        }

        try {
            this.console.clear();

            if (type === 'zip') {
                this.console.info(`Reading ZIP file: ${files[0].name}`);

                // Read ZIP file
                this.filesMap = await this.fileHandler.readZipFile(files[0]);
            } else {
                this.console.info(`Reading ${files.length} files from folder...`);

                // Read directory
                this.filesMap = await this.fileHandler.readDirectory(files);
            }

            const styleName = this.fileHandler.getStyleName();

            this.console.success(`Loaded ${this.filesMap.size} files from "${styleName}"`);

            // Show file info
            const sourceType = type === 'zip' ? 'ZIP file' : 'folder';
            document.getElementById('fileCount').textContent = `${this.filesMap.size} files loaded from ${sourceType}`;
            document.getElementById('styleName').textContent = `Style: ${styleName}`;
            document.getElementById('fileInfo').classList.remove('d-none');

            // Enable convert button
            document.getElementById('convertBtn').disabled = false;

            this.console.separator();
            this.console.info('Ready to convert! Click the "Convert Style" button.');

        } catch (error) {
            this.console.error(`Error reading files: ${error.message}`);
            console.error(error);
        }
    }

    async convert() {
        if (!this.filesMap || this.filesMap.size === 0) {
            this.console.error('No files uploaded!');
            return;
        }

        try {
            // Disable button and show spinner
            document.getElementById('convertBtn').disabled = true;
            document.getElementById('loadingSpinner').classList.remove('d-none');

            this.console.clear();
            this.console.separator();
            this.console.info('🚀 Starting conversion...');
            this.console.separator();
            this.console.blank();

            // Create converter
            const createZip = document.getElementById('createZip').checked;
            this.converter = new BrowserStyleConverter({
                createZip,
                onProgress: (msg) => this.console.info(msg)
            });

            // Convert
            const result = await this.converter.convert(this.filesMap);

            this.console.blank();
            this.console.separator();
            this.console.success('✓ Conversion completed successfully!');
            this.console.separator();
            this.console.blank();

            // Show results
            this.console.info(`Style: ${result.styleName}`);
            this.console.info(`Complexity: ${result.analysis.complexity}`);
            this.console.info(`Template: ${result.analysis.template}`);
            this.console.info(`Lines of code: ${result.analysis.linesOfCode}`);

            if (result.analysis.customCode.customFunctions.length > 0) {
                this.console.blank();
                this.console.info('Custom features preserved:');
                result.analysis.customCode.customFunctions.forEach(feature => {
                    this.console.success(`  - ${feature}`);
                });
            }

            // Download ZIP
            if (result.zipBlob) {
                this.console.blank();
                this.console.info('Downloading ZIP file...');
                saveAs(result.zipBlob, `${result.styleName}-3.0.zip`);
                this.console.success(`Downloaded: ${result.styleName}-3.0.zip`);
                this.console.blank();
                this.console.info('✨ You can now import this ZIP into eXeLearning 3.0!');
            }

            this.console.blank();
            this.console.separator();

        } catch (error) {
            this.console.blank();
            this.console.separator();
            this.console.error(`Conversion failed: ${error.message}`);
            this.console.separator();
            console.error(error);
        } finally {
            // Re-enable button and hide spinner
            document.getElementById('convertBtn').disabled = false;
            document.getElementById('loadingSpinner').classList.add('d-none');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
