import JSZip from 'jszip';

/**
 * Browser-based file handler
 * Handles file/directory upload and reading in the browser
 * Supports both folder upload and ZIP file upload
 */
export class BrowserFileHandler {
    constructor() {
        this.filesMap = new Map();
        this.styleName = null;
    }

    /**
     * Read files from directory upload
     * @param {FileList} fileList - Files from input[type=file][webkitdirectory]
     * @returns {Promise<Map>} Map of filepath → {content, type, size, isText}
     */
    async readDirectory(fileList) {
        this.filesMap.clear();

        const files = Array.from(fileList);

        for (const file of files) {
            // Get relative path
            const relativePath = file.webkitRelativePath || file.name;

            // Determine if text or binary
            const isText = this.isTextFile(file);

            // Read file
            const content = await this.readFile(file, isText);

            this.filesMap.set(relativePath, {
                content,
                type: file.type,
                size: file.size,
                isText,
                file // Keep reference to original File object
            });
        }

        // Extract style name from first file path
        if (this.filesMap.size > 0) {
            const firstPath = this.filesMap.keys().next().value;
            const parts = firstPath.split('/');
            this.styleName = parts[0] || 'converted-style';
        }

        return this.filesMap;
    }

    /**
     * Read files from a ZIP file
     * @param {File} zipFile - ZIP file object
     * @returns {Promise<Map>} Map of filepath → {content, type, size, isText}
     */
    async readZipFile(zipFile) {
        this.filesMap.clear();

        // Extract style name from ZIP filename (remove .zip extension)
        this.styleName = zipFile.name.replace(/\.zip$/i, '');

        try {
            // Load ZIP file
            const zip = await JSZip.loadAsync(zipFile);

            // Process each file in the ZIP
            for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
                // Skip directories
                if (zipEntry.dir) continue;

                // Skip macOS metadata files
                if (relativePath.includes('__MACOSX') || relativePath.includes('.DS_Store')) {
                    continue;
                }

                // Determine if text or binary based on filename
                const isText = this.isTextFileByName(relativePath);

                // Read file content
                const content = isText
                    ? await zipEntry.async('text')
                    : await zipEntry.async('arraybuffer');

                // Store in filesMap
                this.filesMap.set(relativePath, {
                    content,
                    type: this.getMimeTypeByName(relativePath),
                    size: zipEntry._data ? zipEntry._data.uncompressedSize : 0,
                    isText
                });
            }

            return this.filesMap;

        } catch (error) {
            throw new Error(`Failed to read ZIP file: ${error.message}`);
        }
    }

    /**
     * Check if file should be read as text based on File object
     */
    isTextFile(file) {
        const textExtensions = [
            '.js', '.css', '.xml', '.html', '.htm',
            '.txt', '.json', '.md', '.svg'
        ];

        const filename = file.name.toLowerCase();

        // Check by extension
        if (textExtensions.some(ext => filename.endsWith(ext))) {
            return true;
        }

        // Check by MIME type
        if (file.type && file.type.startsWith('text/')) {
            return true;
        }

        return false;
    }

    /**
     * Read a single file
     * @param {File} file - File object
     * @param {boolean} asText - Read as text or binary
     * @returns {Promise<string|ArrayBuffer>}
     */
    async readFile(file, asText = true) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                resolve(e.target.result);
            };

            reader.onerror = (e) => {
                reject(new Error(`Failed to read file ${file.name}: ${e.target.error}`));
            };

            if (asText) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    /**
     * Get the style name
     * @returns {string} The style name extracted from ZIP filename or directory
     */
    getStyleName() {
        return this.styleName || 'converted-style';
    }

    /**
     * Find a specific file by pattern
     */
    findFile(pattern) {
        for (const [path, fileData] of this.filesMap) {
            const filename = path.split('/').pop();
            if (typeof pattern === 'string' && filename === pattern) {
                return fileData;
            }
            if (pattern instanceof RegExp && pattern.test(filename)) {
                return fileData;
            }
        }
        return null;
    }

    /**
     * Get all files matching a pattern
     */
    findFiles(pattern) {
        const matches = [];
        for (const [path, fileData] of this.filesMap) {
            const filename = path.split('/').pop();
            if (typeof pattern === 'string' && filename.includes(pattern)) {
                matches.push({ path, ...fileData });
            }
            if (pattern instanceof RegExp && pattern.test(filename)) {
                matches.push({ path, ...fileData });
            }
        }
        return matches;
    }

    /**
     * Get files by extension
     */
    getFilesByExtension(extension) {
        const ext = extension.startsWith('.') ? extension : '.' + extension;
        const matches = [];

        for (const [path, fileData] of this.filesMap) {
            if (path.toLowerCase().endsWith(ext.toLowerCase())) {
                matches.push({ path, ...fileData });
            }
        }

        return matches;
    }

    /**
     * Check if filename indicates a text file
     * @param {string} filename - Filename or path
     * @returns {boolean}
     */
    isTextFileByName(filename) {
        const textExtensions = [
            '.js', '.css', '.xml', '.html', '.htm',
            '.txt', '.json', '.md', '.svg'
        ];

        const lowerFilename = filename.toLowerCase();
        return textExtensions.some(ext => lowerFilename.endsWith(ext));
    }

    /**
     * Get MIME type by filename
     * @param {string} filename - Filename or path
     * @returns {string}
     */
    getMimeTypeByName(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'js': 'application/javascript',
            'css': 'text/css',
            'xml': 'application/xml',
            'html': 'text/html',
            'htm': 'text/html',
            'txt': 'text/plain',
            'json': 'application/json',
            'md': 'text/markdown',
            'svg': 'image/svg+xml',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'ttf': 'font/ttf',
            'eot': 'application/vnd.ms-fontobject',
            'otf': 'font/otf'
        };

        return mimeTypes[ext] || 'application/octet-stream';
    }
}
