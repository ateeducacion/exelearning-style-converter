import fs from 'fs-extra';
import path from 'path';

/**
 * Merges and updates CSS files from v2.9 to v3.0 format
 */
export class CSSMerger {
    constructor(inputPath, analysis) {
        this.inputPath = inputPath;
        this.analysis = analysis;
        this.changes = [];
    }

    /**
     * Main merge method
     */
    async merge() {
        const cssFiles = this.analysis.cssFiles;
        let mergedCSS = '';

        // Read and combine all CSS files
        for (const cssFile of cssFiles) {
            const cssPath = path.join(this.inputPath, cssFile);
            if (await fs.pathExists(cssPath)) {
                let content = await fs.readFile(cssPath, 'utf-8');

                // Add a comment indicating the source file
                mergedCSS += `/* ========================================\n`;
                mergedCSS += `   Source: ${cssFile}\n`;
                mergedCSS += `   ======================================== */\n\n`;

                mergedCSS += content + '\n\n';
            }
        }

        // Update the CSS content
        mergedCSS = this.updateCSS(mergedCSS);

        return {
            content: mergedCSS,
            changes: this.changes
        };
    }

    /**
     * Update CSS content to match v3.0 conventions
     */
    updateCSS(css) {
        let updated = css;

        // Update class selectors
        updated = this.updateClassSelectors(updated);

        // Update ID selectors
        updated = this.updateIDSelectors(updated);

        // Update asset paths
        updated = this.updateAssetPaths(updated);

        return updated;
    }

    /**
     * Update class selectors to match v3.0 naming
     */
    updateClassSelectors(css) {
        let updated = css;
        const classReplacements = [
            { old: '.no-nav', new: '.siteNav-off', description: 'Updated navigation toggle class' },
            { old: '.hide-nav', new: '.siteNav-off', description: 'Updated navigation toggle class' },
            { old: '.show-nav', new: '.siteNav-on', description: 'Updated navigation toggle class' }
        ];

        for (const replacement of classReplacements) {
            const regex = new RegExp(replacement.old.replace('.', '\\.'), 'g');
            const count = (updated.match(regex) || []).length;

            if (count > 0) {
                updated = updated.replace(regex, replacement.new);
                this.changes.push({
                    type: 'class',
                    old: replacement.old,
                    new: replacement.new,
                    count,
                    description: replacement.description
                });
            }
        }

        return updated;
    }

    /**
     * Update ID selectors to match v3.0 naming
     */
    updateIDSelectors(css) {
        let updated = css;
        const idReplacements = [
            { old: '#toggle-nav', new: '#siteNavToggler', description: 'Updated menu toggle button ID' },
            { old: '#nav-toggler', new: '#siteNavToggler', description: 'Updated menu toggle button ID' },
            { old: '#header-options', new: '#siteNavToggler', description: 'Updated menu toggle container ID' }
        ];

        for (const replacement of idReplacements) {
            const regex = new RegExp(replacement.old.replace('#', '\\#'), 'g');
            const count = (updated.match(regex) || []).length;

            if (count > 0) {
                updated = updated.replace(regex, replacement.new);
                this.changes.push({
                    type: 'id',
                    old: replacement.old,
                    new: replacement.new,
                    count,
                    description: replacement.description
                });
            }
        }

        return updated;
    }

    /**
     * Update asset paths to match new directory structure
     */
    updateAssetPaths(css) {
        let updated = css;

        // Update icon paths (small images, typically .gif or .svg in root)
        const iconPatterns = [
            { pattern: /url\s*\(\s*['"]?([^'")\s]*icon[^'")\s]*\.(gif|svg|png))['"]?\s*\)/gi, prefix: 'icons/' },
            { pattern: /url\s*\(\s*['"]?([^'")\s\/]*\.(gif))['"]?\s*\)/gi, prefix: 'icons/' }
        ];

        for (const { pattern, prefix } of iconPatterns) {
            updated = updated.replace(pattern, (match, filename) => {
                // Don't add prefix if it's already there or if it's a URL
                if (filename.startsWith('http') ||
                    filename.startsWith('//') ||
                    filename.startsWith('data:') ||
                    filename.includes('/')) {
                    return match;
                }

                this.changes.push({
                    type: 'asset-path',
                    old: filename,
                    new: prefix + filename,
                    description: 'Updated asset path to new directory structure'
                });

                return `url('${prefix}${filename}')`;
            });
        }

        // Update image paths (larger images, typically .png, .jpg)
        const imagePatterns = [
            { pattern: /url\s*\(\s*['"]?([^'")\s]*\.(png|jpg|jpeg))['"]?\s*\)/gi, prefix: 'img/' }
        ];

        for (const { pattern, prefix } of imagePatterns) {
            updated = updated.replace(pattern, (match, filename) => {
                // Don't add prefix if it's already there or if it's a URL
                if (filename.startsWith('http') ||
                    filename.startsWith('//') ||
                    filename.startsWith('data:') ||
                    filename.includes('/') ||
                    filename.includes('icon')) { // Skip if already handled as icon
                    return match;
                }

                this.changes.push({
                    type: 'asset-path',
                    old: filename,
                    new: prefix + filename,
                    description: 'Updated asset path to new directory structure'
                });

                return `url('${prefix}${filename}')`;
            });
        }

        // Update font paths
        const fontPatterns = [
            { pattern: /url\s*\(\s*['"]?([^'")\s]*\.(woff|woff2|ttf|eot|otf))['"]?\s*\)/gi, prefix: 'fonts/' }
        ];

        for (const { pattern, prefix } of fontPatterns) {
            updated = updated.replace(pattern, (match, filename) => {
                // Don't add prefix if it's already there or if it's a URL
                if (filename.startsWith('http') ||
                    filename.startsWith('//') ||
                    filename.startsWith('data:') ||
                    filename.includes('/')) {
                    return match;
                }

                this.changes.push({
                    type: 'asset-path',
                    old: filename,
                    new: prefix + filename,
                    description: 'Updated font path to new directory structure'
                });

                return `url('${prefix}${filename}')`;
            });
        }

        return updated;
    }

    /**
     * Get a summary of changes made
     */
    getSummary() {
        const summary = {
            totalChanges: this.changes.length,
            byType: {}
        };

        for (const change of this.changes) {
            if (!summary.byType[change.type]) {
                summary.byType[change.type] = 0;
            }
            summary.byType[change.type]++;
        }

        return summary;
    }
}
