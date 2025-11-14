import fs from 'fs-extra';
import path from 'path';

/**
 * Migrates assets to organized subdirectories
 */
export class AssetMigrator {
    constructor(inputPath, outputPath) {
        this.inputPath = inputPath;
        this.outputPath = outputPath;
        this.migrations = [];
    }

    /**
     * Main migration method
     */
    async migrate() {
        const files = await fs.readdir(this.inputPath);

        for (const file of files) {
            const filePath = path.join(this.inputPath, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile()) {
                const destination = this.getDestination(file);
                if (destination) {
                    await this.migrateFile(file, destination);
                }
            }
        }

        return {
            migrations: this.migrations,
            summary: this.getSummary()
        };
    }

    /**
     * Determine destination directory for a file
     */
    getDestination(filename) {
        const ext = path.extname(filename).toLowerCase();
        const basename = path.basename(filename, ext);

        // Skip files that should stay in root
        const rootFiles = ['config.xml', 'style.css', 'style.js', 'screenshot.png', 'readme.md'];
        if (rootFiles.includes(filename.toLowerCase())) {
            return null;
        }

        // Icons: small images, gifs, or files with 'icon' in name
        if (filename.toLowerCase().includes('icon') ||
            ext === '.gif' ||
            (ext === '.svg' && this.isSmallFile(filename))) {
            return 'icons';
        }

        // Fonts
        if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) {
            return 'fonts';
        }

        // Images
        if (['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext)) {
            return 'img';
        }

        // Keep other files in root or skip
        return null;
    }

    /**
     * Check if a file is small (likely an icon)
     */
    isSmallFile(filename) {
        try {
            const filePath = path.join(this.inputPath, filename);
            const stats = fs.statSync(filePath);
            // Files smaller than 50KB are considered small (likely icons)
            return stats.size < 50 * 1024;
        } catch (e) {
            return false;
        }
    }

    /**
     * Migrate a single file to its destination
     */
    async migrateFile(filename, destinationDir) {
        const sourcePath = path.join(this.inputPath, filename);
        const destDirPath = path.join(this.outputPath, destinationDir);
        const destFilePath = path.join(destDirPath, filename);

        // Create destination directory if it doesn't exist
        await fs.ensureDir(destDirPath);

        // Copy the file
        await fs.copy(sourcePath, destFilePath, { overwrite: true });

        this.migrations.push({
            filename,
            from: filename,
            to: `${destinationDir}/${filename}`,
            type: destinationDir
        });
    }

    /**
     * Get migration summary
     */
    getSummary() {
        const summary = {
            total: this.migrations.length,
            byType: {}
        };

        for (const migration of this.migrations) {
            if (!summary.byType[migration.type]) {
                summary.byType[migration.type] = 0;
            }
            summary.byType[migration.type]++;
        }

        return summary;
    }
}
