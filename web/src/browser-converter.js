import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { templates } from './templates.js';

/**
 * Browser-adapted style converter
 * Converts eXeLearning styles from v2.9 to v3.0 in the browser
 */
export class BrowserStyleConverter {
    constructor(options = {}) {
        this.options = {
            createZip: options.createZip !== false,
            onProgress: options.onProgress || (() => {}),
            ...options
        };
    }

    /**
     * Main conversion method
     * @param {Map} filesMap - Map of filepath → fileData
     * @param {string} styleName - Optional style name (from ZIP filename or folder name)
     * @returns {Promise<Object>} Conversion results
     */
    async convert(filesMap, styleName = null) {
        try {
            this.onProgress('Starting conversion...');

            // Step 1: Analyze
            const analysis = this.analyze(filesMap, styleName);
            this.onProgress(`Analysis complete: ${analysis.complexity} style (${analysis.template} template)`);

            // Step 2: Transform JavaScript
            const jsContent = this.transformJavaScript(analysis, filesMap);
            this.onProgress('JavaScript transformed');

            // Step 3: Merge CSS
            const cssContent = this.mergeCSS(analysis, filesMap);
            this.onProgress('CSS merged and updated');

            // Step 4: Update config.xml
            const configContent = this.updateConfig(analysis, filesMap);
            this.onProgress('config.xml updated');

            // Step 5: Organize assets
            const assets = this.organizeAssets(filesMap);
            this.onProgress(`Assets organized (${assets.size} files)`);

            // Step 6: Create ZIP
            let zipBlob = null;
            if (this.options.createZip) {
                this.onProgress('Creating ZIP file...');
                zipBlob = await this.createZip(analysis.styleName, {
                    'config.xml': configContent,
                    'style.js': jsContent,
                    'style.css': cssContent
                }, assets);
                this.onProgress(`ZIP created: ${analysis.styleName}-3.0.zip`);
            }

            return {
                styleName: analysis.styleName,
                analysis,
                files: {
                    'config.xml': configContent,
                    'style.js': jsContent,
                    'style.css': cssContent
                },
                assets,
                zipBlob
            };

        } catch (error) {
            this.onProgress(`Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Analyze the uploaded style
     */
    analyze(filesMap, providedStyleName = null) {
        const styleName = providedStyleName || this.getStyleName(filesMap);

        // Find JavaScript file
        const jsFile = this.findJSFile(filesMap);
        const jsContent = jsFile ? jsFile.content : '';

        // Find CSS files
        const cssFiles = this.findCSSFiles(filesMap);

        // Analyze complexity
        const linesOfCode = jsContent.split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).length;

        const hasH5P = jsContent.includes('h5pResizerInitialized') || jsContent.includes('H5P iframe Resizer');
        const hasCharacters = jsContent.includes('$exeDevice.characters') || jsContent.includes('.udl-character');
        const hasPhaseManagement = jsContent.includes('nodeSubSection') || jsContent.includes('nodeSection');
        const hasPrintContent = jsContent.includes('printContent') && jsContent.includes('function');
        const hasCommonInit = jsContent.includes('common') && jsContent.match(/common\s*:\s*{/);

        const customFunctions = [];
        if (hasH5P) customFunctions.push('H5P iframe resizer');
        if (hasCharacters) customFunctions.push('Character management');
        if (hasPhaseManagement) customFunctions.push('Phase management');
        if (hasPrintContent) customFunctions.push('printContent()');
        if (hasCommonInit) customFunctions.push('common.init()');

        let complexity = 'simple';
        let template = 'base';

        if (hasH5P || hasCharacters || hasPhaseManagement || linesOfCode > 300) {
            complexity = 'complex';
            template = 'neo';
        } else if (hasPrintContent || hasCommonInit || customFunctions.length > 2) {
            complexity = 'moderate';
            template = 'base';
        }

        return {
            styleName,
            complexity,
            template,
            jsFile: jsFile ? jsFile.path : null,
            jsContent,
            cssFiles: cssFiles.map(f => f.path),
            linesOfCode,
            customCode: {
                hasH5P,
                hasCharacters,
                hasPhaseManagement,
                hasPrintContent,
                hasCommonInit,
                customFunctions
            }
        };
    }

    /**
     * Transform JavaScript using template
     */
    transformJavaScript(analysis, filesMap) {
        const template = templates[analysis.template];
        if (!template) {
            throw new Error(`Template not found: ${analysis.template}`);
        }

        let newJS = template.js;

        // For complex styles, try to preserve custom code
        if (analysis.complexity !== 'simple' && analysis.jsContent) {
            const customCode = this.extractCustomCode(analysis.jsContent, analysis.customCode);
            if (customCode.length > 0) {
                newJS += '\n\n// === CUSTOM CODE PRESERVED FROM v2.9 ===\n';
                newJS += customCode.join('\n\n');
            }
        }

        return newJS;
    }

    /**
     * Extract custom code sections
     */
    extractCustomCode(oldJS, customFlags) {
        const sections = [];

        // Extract H5P
        if (customFlags.hasH5P) {
            const h5pMatch = oldJS.match(/\/\/ H5P iframe Resizer[\s\S]*?\(function\s*\(\)\s*{[\s\S]*?}\)\(\);/);
            if (h5pMatch) sections.push(h5pMatch[0]);
        }

        // Extract character management
        if (customFlags.hasCharacters) {
            const charMatch = oldJS.match(/document\.addEventListener\s*\(\s*["']DOMContentLoaded["']\s*,\s*\(event\)\s*=>\s*{[\s\S]*?\.udl-character[\s\S]*?}\);/);
            if (charMatch) sections.push(charMatch[0]);

            const devMatch = oldJS.match(/if\s*\(\s*typeof\s+\$exeDevice\s*!==\s*["']undefined["']\s*\)\s*{[\s\S]*?\$exeDevice\.characters[\s\S]*?}/);
            if (devMatch) sections.push(devMatch[0]);
        }

        return sections;
    }

    /**
     * Merge CSS files
     */
    mergeCSS(analysis, filesMap) {
        const cssFiles = analysis.cssFiles;
        let mergedCSS = '';

        for (const cssPath of cssFiles) {
            const fileData = Array.from(filesMap.values()).find(f => f.path === cssPath);
            if (fileData) {
                mergedCSS += `/* Source: ${cssPath.split('/').pop()} */\n\n`;
                mergedCSS += fileData.content + '\n\n';
            }
        }

        // Update selectors and paths
        mergedCSS = mergedCSS.replace(/\.no-nav/g, '.siteNav-off');
        mergedCSS = mergedCSS.replace(/#toggle-nav/g, '#siteNavToggler');
        mergedCSS = mergedCSS.replace(/url\s*\(\s*['"]?([^'")\s]*\.(gif|svg))['"]?\s*\)/gi, (match, filename) => {
            if (filename.includes('/') || filename.startsWith('http') || filename.startsWith('data:')) {
                return match;
            }
            return `url('icons/${filename}')`;
        });
        mergedCSS = mergedCSS.replace(/url\s*\(\s*['"]?([^'")\s]*\.(png|jpg|jpeg))['"]?\s*\)/gi, (match, filename) => {
            if (filename.includes('/') || filename.startsWith('http') || filename.startsWith('data:') || filename.includes('icon')) {
                return match;
            }
            return `url('img/${filename}')`;
        });
        mergedCSS = mergedCSS.replace(/url\s*\(\s*['"]?([^'")\s]*\.(woff|woff2|ttf|eot|otf))['"]?\s*\)/gi, (match, filename) => {
            if (filename.includes('/') || filename.startsWith('http') || filename.startsWith('data:')) {
                return match;
            }
            return `url('fonts/${filename}')`;
        });

        return mergedCSS;
    }

    /**
     * Update config.xml
     */
    updateConfig(analysis, filesMap) {
        // Find config.xml
        const configFile = Array.from(filesMap.values()).find(f =>
            f.path && f.path.toLowerCase().endsWith('config.xml')
        );

        const oldConfig = configFile ? configFile.content : '';

        // Parse old config (simple regex-based parsing)
        const getName = oldConfig.match(/<name>(.*?)<\/name>/);
        const getAuthor = oldConfig.match(/<author>(.*?)<\/author>/);
        const getAuthorUrl = oldConfig.match(/<author-url>(.*?)<\/author-url>/);
        const getLicense = oldConfig.match(/<license>(.*?)<\/license>/);
        const getLicenseUrl = oldConfig.match(/<license-url>(.*?)<\/license-url>/);
        const getDesc = oldConfig.match(/<description>(.*?)<\/description>/);

        const name = getName ? getName[1] : analysis.styleName;
        const title = name;
        const author = getAuthor ? getAuthor[1] : 'Unknown';
        const authorUrl = getAuthorUrl ? getAuthorUrl[1] : '';
        const license = getLicense ? getLicense[1] : 'Creative Commons by-sa';
        const licenseUrl = getLicenseUrl ? getLicenseUrl[1] : 'http://creativecommons.org/licenses/by-sa/3.0/';
        const description = getDesc ? getDesc[1] : 'Converted from v2.9 to v3.0';

        // Generate new config.xml
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<theme>\n';
        xml += `    <name>${this.escapeXml(name)}</name>\n`;
        xml += `    <title>${this.escapeXml(title)}</title>\n`;
        xml += `    <version>2025</version>\n`;
        xml += `    <compatibility>3.0</compatibility>\n`;
        xml += `    <author>${this.escapeXml(author)}</author>\n`;
        if (authorUrl) xml += `    <author-url>${this.escapeXml(authorUrl)}</author-url>\n`;
        xml += `    <license>${this.escapeXml(license)}</license>\n`;
        xml += `    <license-url>${this.escapeXml(licenseUrl)}</license-url>\n`;
        xml += `    <description>${this.escapeXml(description)}</description>\n`;
        xml += `    <downloadable>1</downloadable>\n`;
        xml += '</theme>\n';

        return xml;
    }

    /**
     * Organize assets into subdirectories
     */
    organizeAssets(filesMap) {
        const assets = new Map();
        const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.otf'];

        for (const [path, fileData] of filesMap) {
            const filename = path.split('/').pop();
            const ext = '.' + filename.split('.').pop().toLowerCase();

            if (!assetExtensions.includes(ext)) continue;
            if (!fileData.content) continue;

            let destPath;
            if (ext === '.gif' || (ext === '.svg' && fileData.size < 50000) || filename.includes('icon')) {
                destPath = `icons/${filename}`;
            } else if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) {
                destPath = `fonts/${filename}`;
            } else {
                destPath = `img/${filename}`;
            }

            assets.set(destPath, fileData.content);
        }

        return assets;
    }

    /**
     * Create ZIP file
     */
    async createZip(styleName, files, assets) {
        const zip = new JSZip();

        // Add main files
        for (const [filename, content] of Object.entries(files)) {
            zip.file(filename, content);
        }

        // Add assets
        for (const [path, content] of assets) {
            zip.file(path, content);
        }

        // Generate ZIP blob
        return await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });
    }

    /**
     * Helper methods
     */
    getStyleName(filesMap) {
        if (filesMap.size === 0) return 'converted-style';
        const firstPath = filesMap.keys().next().value;
        const parts = firstPath.split('/');
        return parts[0] || 'converted-style';
    }

    findJSFile(filesMap) {
        for (const [path, fileData] of filesMap) {
            if (path.endsWith('.js') && fileData.isText) {
                return { path, ...fileData };
            }
        }
        return null;
    }

    findCSSFiles(filesMap) {
        const cssFiles = [];
        for (const [path, fileData] of filesMap) {
            if (path.endsWith('.css') && fileData.isText) {
                cssFiles.push({ path, ...fileData });
            }
        }
        return cssFiles;
    }

    escapeXml(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    onProgress(message) {
        if (this.options.onProgress) {
            this.options.onProgress(message);
        }
    }
}
