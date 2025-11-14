import fs from 'fs-extra';
import path from 'path';
import xml2js from 'xml2js';

/**
 * Validates the converted style
 */
export class StyleValidator {
    constructor(outputPath) {
        this.outputPath = outputPath;
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    /**
     * Main validation method
     */
    async validate() {
        await this.validateFileStructure();
        await this.validateConfigXml();
        await this.validateJavaScript();
        await this.validateCSS();
        await this.validateAssets();

        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            info: this.info
        };
    }

    /**
     * Validate required file structure
     */
    async validateFileStructure() {
        const requiredFiles = ['config.xml', 'style.js', 'style.css'];

        for (const file of requiredFiles) {
            const filePath = path.join(this.outputPath, file);
            if (!await fs.pathExists(filePath)) {
                this.errors.push({
                    type: 'missing-file',
                    message: `Required file ${file} is missing`,
                    severity: 'error'
                });
            } else {
                this.info.push({
                    type: 'file-exists',
                    message: `Required file ${file} exists`,
                    severity: 'info'
                });
            }
        }

        // Check for expected directories
        const expectedDirs = ['icons', 'img', 'fonts'];
        for (const dir of expectedDirs) {
            const dirPath = path.join(this.outputPath, dir);
            if (!await fs.pathExists(dirPath)) {
                this.warnings.push({
                    type: 'missing-directory',
                    message: `Expected directory ${dir}/ is missing (may be empty)`,
                    severity: 'warning'
                });
            }
        }
    }

    /**
     * Validate config.xml
     */
    async validateConfigXml() {
        const configPath = path.join(this.outputPath, 'config.xml');

        if (!await fs.pathExists(configPath)) {
            return; // Already reported as error
        }

        try {
            const content = await fs.readFile(configPath, 'utf-8');
            const parser = new xml2js.Parser();
            const config = await parser.parseStringPromise(content);

            // Check required fields
            const requiredFields = ['name', 'compatibility', 'version'];
            const theme = config.theme || {};

            for (const field of requiredFields) {
                if (!theme[field] || !theme[field][0]) {
                    this.errors.push({
                        type: 'config-field-missing',
                        message: `config.xml is missing required field: ${field}`,
                        severity: 'error'
                    });
                }
            }

            // Check compatibility is 3.0
            if (theme.compatibility && theme.compatibility[0] !== '3.0') {
                this.errors.push({
                    type: 'config-compatibility',
                    message: `config.xml compatibility should be 3.0, found: ${theme.compatibility[0]}`,
                    severity: 'error'
                });
            }

            // Check for deprecated fields
            const deprecatedFields = ['extra-head', 'extra-body', 'edition-extra-head'];
            for (const field of deprecatedFields) {
                if (theme[field]) {
                    this.warnings.push({
                        type: 'config-deprecated-field',
                        message: `config.xml contains deprecated field: ${field}`,
                        severity: 'warning'
                    });
                }
            }

            this.info.push({
                type: 'config-valid',
                message: 'config.xml is valid XML',
                severity: 'info'
            });
        } catch (e) {
            this.errors.push({
                type: 'config-invalid-xml',
                message: `config.xml is not valid XML: ${e.message}`,
                severity: 'error'
            });
        }
    }

    /**
     * Validate JavaScript
     */
    async validateJavaScript() {
        const jsPath = path.join(this.outputPath, 'style.js');

        if (!await fs.pathExists(jsPath)) {
            return; // Already reported as error
        }

        try {
            const content = await fs.readFile(jsPath, 'utf-8');

            // Check for myTheme object
            if (!content.includes('var myTheme')) {
                this.errors.push({
                    type: 'js-missing-mytheme',
                    message: 'style.js is missing myTheme object',
                    severity: 'error'
                });
            }

            // Check for required v3.0 functions
            const requiredFunctions = [
                'init',
                'inIframe',
                'searchForm',
                'isLowRes',
                'checkNav',
                'param',
                'params'
            ];

            for (const func of requiredFunctions) {
                if (!content.includes(`${func}:`) && !content.includes(`${func} :`)) {
                    this.warnings.push({
                        type: 'js-missing-function',
                        message: `style.js is missing expected function: ${func}`,
                        severity: 'warning'
                    });
                }
            }

            // Check for isInViewport jQuery extension
            if (!content.includes('$.fn.isInViewport')) {
                this.warnings.push({
                    type: 'js-missing-extension',
                    message: 'style.js is missing $.fn.isInViewport extension',
                    severity: 'warning'
                });
            }

            // Check for initialization code
            if (!content.includes('myTheme.init()')) {
                this.errors.push({
                    type: 'js-missing-init',
                    message: 'style.js does not call myTheme.init()',
                    severity: 'error'
                });
            }

            // Basic syntax check (look for common errors)
            const lines = content.split('\n');
            let braceCount = 0;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;
            }

            if (braceCount !== 0) {
                this.warnings.push({
                    type: 'js-syntax-warning',
                    message: `style.js may have mismatched braces (difference: ${braceCount}). This may be inherited from the original v2.9 code.`,
                    severity: 'warning'
                });
            }

            this.info.push({
                type: 'js-valid',
                message: 'style.js passed basic validation',
                severity: 'info'
            });
        } catch (e) {
            this.errors.push({
                type: 'js-read-error',
                message: `Could not read style.js: ${e.message}`,
                severity: 'error'
            });
        }
    }

    /**
     * Validate CSS
     */
    async validateCSS() {
        const cssPath = path.join(this.outputPath, 'style.css');

        if (!await fs.pathExists(cssPath)) {
            return; // Already reported as error
        }

        try {
            const content = await fs.readFile(cssPath, 'utf-8');

            // Check if CSS is not empty
            if (content.trim().length === 0) {
                this.warnings.push({
                    type: 'css-empty',
                    message: 'style.css is empty',
                    severity: 'warning'
                });
            }

            // Check for old selectors that should have been updated
            const oldSelectors = ['.no-nav', '#toggle-nav', '.hide-nav', '.show-nav'];
            for (const selector of oldSelectors) {
                if (content.includes(selector)) {
                    this.warnings.push({
                        type: 'css-old-selector',
                        message: `style.css contains old v2.9 selector: ${selector}`,
                        severity: 'warning'
                    });
                }
            }

            // Check for asset paths without subdirectories (might need updating)
            const assetWithoutPath = content.match(/url\s*\(\s*['"]?([^'")\s\/]+\.(gif|png|jpg|jpeg|woff|woff2|ttf))['"]?\s*\)/gi);
            if (assetWithoutPath && assetWithoutPath.length > 0) {
                this.warnings.push({
                    type: 'css-asset-paths',
                    message: `style.css may have asset paths without subdirectories (found ${assetWithoutPath.length} instances)`,
                    severity: 'warning',
                    detail: `Consider reviewing: ${assetWithoutPath.slice(0, 3).join(', ')}`
                });
            }

            this.info.push({
                type: 'css-valid',
                message: 'style.css passed basic validation',
                severity: 'info'
            });
        } catch (e) {
            this.errors.push({
                type: 'css-read-error',
                message: `Could not read style.css: ${e.message}`,
                severity: 'error'
            });
        }
    }

    /**
     * Validate assets
     */
    async validateAssets() {
        const assetDirs = ['icons', 'img', 'fonts'];
        let totalAssets = 0;

        for (const dir of assetDirs) {
            const dirPath = path.join(this.outputPath, dir);
            if (await fs.pathExists(dirPath)) {
                const files = await fs.readdir(dirPath);
                totalAssets += files.length;

                if (files.length > 0) {
                    this.info.push({
                        type: 'assets-found',
                        message: `Found ${files.length} files in ${dir}/`,
                        severity: 'info'
                    });
                }
            }
        }

        if (totalAssets === 0) {
            this.warnings.push({
                type: 'no-assets',
                message: 'No assets found in icons/, img/, or fonts/ directories',
                severity: 'warning'
            });
        }
    }

    /**
     * Get validation summary
     */
    getSummary() {
        return {
            isValid: this.errors.length === 0,
            errorCount: this.errors.length,
            warningCount: this.warnings.length,
            infoCount: this.info.length
        };
    }
}
