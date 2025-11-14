import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';

/**
 * Creates a ZIP file of the converted style, ready for import into eXeLearning 3.0
 */
export class ZipCreator {
    constructor(outputPath, styleName) {
        this.outputPath = outputPath;
        this.styleName = styleName;
    }

    /**
     * Create ZIP file
     */
    async createZip() {
        const zipPath = path.join(path.dirname(this.outputPath), `${this.styleName}-3.0.zip`);

        return new Promise((resolve, reject) => {
            // Create write stream for the ZIP file
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            // Handle stream events
            output.on('close', () => {
                resolve({
                    zipPath,
                    size: archive.pointer(),
                    filesCount: this.filesCount
                });
            });

            output.on('error', (err) => {
                reject(err);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            // Pipe archive data to the file
            archive.pipe(output);

            // Add files to the archive
            this.filesCount = 0;
            this.addFilesToArchive(archive);

            // Finalize the archive
            archive.finalize();
        });
    }

    /**
     * Add files to the archive
     */
    addFilesToArchive(archive) {
        // Required files
        const requiredFiles = ['config.xml', 'style.js', 'style.css'];

        for (const file of requiredFiles) {
            const filePath = path.join(this.outputPath, file);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: file });
                this.filesCount++;
            }
        }

        // Optional screenshot
        const screenshotPath = path.join(this.outputPath, 'screenshot.png');
        if (fs.existsSync(screenshotPath)) {
            archive.file(screenshotPath, { name: 'screenshot.png' });
            this.filesCount++;
        }

        // Add directories (icons, img, fonts) if they exist and are not empty
        const directories = ['icons', 'img', 'fonts'];

        for (const dir of directories) {
            const dirPath = path.join(this.outputPath, dir);
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                if (files.length > 0) {
                    archive.directory(dirPath, dir);
                    this.filesCount += files.length;
                }
            }
        }

        // Note: We deliberately exclude conversion-report.md from the ZIP
        // as it's for the developer, not for eXeLearning import
    }
}
