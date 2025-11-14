/**
 * Browser-based file handler
 * Handles file/directory upload and reading in the browser
 */
export class BrowserFileHandler {
    constructor() {
        this.filesMap = new Map();
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

        return this.filesMap;
    }

    /**
     * Check if file should be read as text
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
     * Get the base directory name from the file paths
     */
    getStyleName() {
        if (this.filesMap.size === 0) {
            return 'converted-style';
        }

        // Get first file path and extract base directory
        const firstPath = this.filesMap.keys().next().value;
        const parts = firstPath.split('/');

        return parts[0] || 'converted-style';
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
}
