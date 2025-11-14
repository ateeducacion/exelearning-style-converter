import fs from 'fs-extra';
import path from 'path';

/**
 * Analyzes old style files to determine complexity and detect custom code
 */
export class StyleAnalyzer {
    constructor(inputPath) {
        this.inputPath = inputPath;
        this.styleName = path.basename(inputPath);
        this.analysis = {
            styleName: this.styleName,
            complexity: 'simple', // simple, moderate, complex
            template: 'base', // base, neo, flux
            jsFile: null,
            jsContent: '',
            cssFiles: [],
            configFile: null,
            assets: [],
            customCode: {
                hasH5P: false,
                hasCharacters: false,
                hasPhaseManagement: false,
                hasPrintContent: false,
                hasCommonInit: false,
                customFunctions: [],
                customEventListeners: [],
                linesOfCode: 0
            },
            warnings: []
        };
    }

    /**
     * Main analysis method
     */
    async analyze() {
        await this.findFiles();
        await this.analyzeJavaScript();
        await this.analyzeCSSFiles();
        this.determineComplexity();
        this.selectTemplate();

        return this.analysis;
    }

    /**
     * Find all relevant files in the input directory
     */
    async findFiles() {
        const files = await fs.readdir(this.inputPath);

        for (const file of files) {
            const filePath = path.join(this.inputPath, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile()) {
                // Find JavaScript file
                if (file.endsWith('_js.js') || file.endsWith('.js')) {
                    this.analysis.jsFile = file;
                }
                // Find CSS files
                else if (file.endsWith('.css')) {
                    this.analysis.cssFiles.push(file);
                }
                // Find config.xml
                else if (file === 'config.xml') {
                    this.analysis.configFile = file;
                }
                // Track assets
                else if (this.isAssetFile(file)) {
                    this.analysis.assets.push(file);
                }
            }
        }

        // Warn if no JavaScript file found
        if (!this.analysis.jsFile) {
            this.analysis.warnings.push('No JavaScript file found');
        }
    }

    /**
     * Check if file is an asset (image, font, etc.)
     */
    isAssetFile(filename) {
        const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg',
                                '.woff', '.woff2', '.ttf', '.eot', '.otf'];
        return assetExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }

    /**
     * Analyze JavaScript file for custom code and complexity
     */
    async analyzeJavaScript() {
        if (!this.analysis.jsFile) {
            return;
        }

        const jsPath = path.join(this.inputPath, this.analysis.jsFile);
        this.analysis.jsContent = await fs.readFile(jsPath, 'utf-8');

        const content = this.analysis.jsContent;
        const lines = content.split('\n');
        this.analysis.customCode.linesOfCode = lines.filter(line =>
            line.trim() && !line.trim().startsWith('//')
        ).length;

        // Detect H5P iframe resizer
        if (content.includes('h5pResizerInitialized') ||
            content.includes('H5P iframe Resizer')) {
            this.analysis.customCode.hasH5P = true;
            this.analysis.customCode.customFunctions.push('H5P iframe resizer');
        }

        // Detect character management
        if (content.includes('$exeDevice.characters') ||
            content.includes('.udl-character')) {
            this.analysis.customCode.hasCharacters = true;
            this.analysis.customCode.customFunctions.push('Character management');
        }

        // Detect phase management
        if (content.includes('nodeSubSection') ||
            content.includes('nodeSection') ||
            content.includes('nodeDecoration')) {
            this.analysis.customCode.hasPhaseManagement = true;
            this.analysis.customCode.customFunctions.push('Phase management');
        }

        // Detect printContent function
        if (content.includes('printContent') &&
            content.includes('function')) {
            this.analysis.customCode.hasPrintContent = true;
            this.analysis.customCode.customFunctions.push('printContent()');
        }

        // Detect common.init
        if (content.includes('common') &&
            content.includes('init') &&
            content.match(/common\s*:\s*{/)) {
            this.analysis.customCode.hasCommonInit = true;
            this.analysis.customCode.customFunctions.push('common.init()');
        }

        // Detect custom event listeners (beyond standard ones)
        const eventListenerPatterns = [
            /addEventListener\s*\(\s*["'](?!resize|load|DOMContentLoaded)/g,
            /\$\([^)]+\)\.on\s*\(\s*["'](?!click|resize)/g
        ];

        for (const pattern of eventListenerPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                this.analysis.customCode.customEventListeners.push(...matches);
            }
        }

        // Look for custom functions outside of myTheme
        const customFunctionMatches = content.match(/^function\s+(\w+)/gm);
        if (customFunctionMatches) {
            this.analysis.customCode.customFunctions.push(
                ...customFunctionMatches.map(m => m.trim())
            );
        }
    }

    /**
     * Analyze CSS files
     */
    async analyzeCSSFiles() {
        // Check if we have the typical content.css + nav.css split
        const hasContentCss = this.analysis.cssFiles.includes('content.css');
        const hasNavCss = this.analysis.cssFiles.includes('nav.css');

        if (hasContentCss && hasNavCss) {
            this.analysis.cssFiles = ['content.css', 'nav.css'];
        } else if (this.analysis.cssFiles.length > 0) {
            // Keep whatever CSS files were found
        } else {
            this.analysis.warnings.push('No CSS files found');
        }
    }

    /**
     * Determine complexity level based on analysis
     */
    determineComplexity() {
        const custom = this.analysis.customCode;

        // Complex: Has H5P, characters, or phase management
        if (custom.hasH5P || custom.hasCharacters || custom.hasPhaseManagement) {
            this.analysis.complexity = 'complex';
            return;
        }

        // Complex: More than 300 lines of code
        if (custom.linesOfCode > 300) {
            this.analysis.complexity = 'complex';
            return;
        }

        // Moderate: Has custom functions or common.init
        if (custom.hasPrintContent ||
            custom.hasCommonInit ||
            custom.customFunctions.length > 2) {
            this.analysis.complexity = 'moderate';
            return;
        }

        // Otherwise: Simple
        this.analysis.complexity = 'simple';
    }

    /**
     * Select appropriate template based on complexity
     */
    selectTemplate() {
        if (this.analysis.complexity === 'complex') {
            // Use neo or flux for complex styles (both have movePageTitle)
            this.analysis.template = 'neo';
        } else {
            // Use base for simple and moderate styles
            this.analysis.template = 'base';
        }
    }

    /**
     * Get a summary of the analysis
     */
    getSummary() {
        const { complexity, template, customCode, warnings } = this.analysis;

        return {
            styleName: this.styleName,
            complexity,
            template,
            linesOfCode: customCode.linesOfCode,
            customFeatures: customCode.customFunctions,
            hasCustomCode: customCode.customFunctions.length > 0,
            warnings: warnings.length > 0 ? warnings : null
        };
    }
}
