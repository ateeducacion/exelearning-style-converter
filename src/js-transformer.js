import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Transforms old JavaScript to new v3.0 format
 */
export class JavaScriptTransformer {
    constructor(analysis, options = {}) {
        this.analysis = analysis;
        this.options = options;
        this.customCodeSections = [];
    }

    /**
     * Main transformation method
     */
    async transform() {
        const templateName = this.analysis.template;
        const templatePath = path.join(
            path.dirname(__dirname),
            'styles-new',
            templateName,
            'style.js'
        );

        // Load the appropriate template
        let newJS = await fs.readFile(templatePath, 'utf-8');

        // For complex styles, extract and preserve custom code
        if (this.analysis.complexity !== 'simple') {
            const customCode = await this.extractCustomCode();
            if (customCode) {
                newJS = this.integrateCustomCode(newJS, customCode);
            }
        }

        return {
            content: newJS,
            customCodeSections: this.customCodeSections
        };
    }

    /**
     * Extract custom code from old JavaScript
     */
    async extractCustomCode() {
        const oldJS = this.analysis.jsContent;
        if (!oldJS) return '';

        const sections = [];

        // Extract printContent function
        if (this.analysis.customCode.hasPrintContent) {
            const printContent = this.extractFunction(oldJS, 'printContent');
            if (printContent) {
                sections.push({
                    name: 'printContent function',
                    code: printContent,
                    location: 'myTheme object'
                });
                this.customCodeSections.push('printContent()');
            }
        }

        // Extract common.init function
        if (this.analysis.customCode.hasCommonInit) {
            const commonInit = this.extractCommonInit(oldJS);
            if (commonInit) {
                sections.push({
                    name: 'common.init function',
                    code: commonInit,
                    location: 'myTheme object'
                });
                this.customCodeSections.push('common.init()');
            }
        }

        // Extract character management code
        if (this.analysis.customCode.hasCharacters) {
            const characters = this.extractCharacterManagement(oldJS);
            if (characters) {
                sections.push({
                    name: 'Character management',
                    code: characters,
                    location: 'after main code'
                });
                this.customCodeSections.push('Character management');
            }
        }

        // Extract H5P iframe resizer
        if (this.analysis.customCode.hasH5P) {
            const h5p = this.extractH5PResizer(oldJS);
            if (h5p) {
                sections.push({
                    name: 'H5P iframe resizer',
                    code: h5p,
                    location: 'after main code'
                });
                this.customCodeSections.push('H5P iframe resizer');
            }
        }

        // Extract phase management
        if (this.analysis.customCode.hasPhaseManagement) {
            const phase = this.extractPhaseManagement(oldJS);
            if (phase) {
                sections.push({
                    name: 'Phase management',
                    code: phase,
                    location: 'common.init'
                });
                this.customCodeSections.push('Phase management');
            }
        }

        return sections;
    }

    /**
     * Extract a specific function from the old JavaScript (handles nested braces)
     */
    extractFunction(code, functionName) {
        // Find the start of the function
        const startRegex = new RegExp(`${functionName}\\s*:\\s*function\\s*\\([^)]*\\)\\s*{`);
        const startMatch = code.match(startRegex);
        if (!startMatch) return null;

        const startIndex = startMatch.index + startMatch[0].length - 1; // Include opening brace

        // Count braces to find matching closing brace
        let braceCount = 0;
        let inString = false;
        let stringChar = null;
        let escaped = false;

        for (let i = startIndex; i < code.length; i++) {
            const char = code[i];

            // Handle escape sequences
            if (escaped) {
                escaped = false;
                continue;
            }
            if (char === '\\') {
                escaped = true;
                continue;
            }

            // Handle strings
            if (!inString && (char === '"' || char === "'" || char === '`')) {
                inString = true;
                stringChar = char;
                continue;
            }
            if (inString && char === stringChar) {
                inString = false;
                stringChar = null;
                continue;
            }

            // Count braces only outside of strings
            if (!inString) {
                if (char === '{') braceCount++;
                if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        // Found matching closing brace
                        const funcCode = code.slice(startMatch.index, i + 1);
                        return funcCode;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Extract common.init object (handles nested braces)
     */
    extractCommonInit(code) {
        // Find the start of common object
        const startMatch = code.match(/common\s*:\s*{/);
        if (!startMatch) return null;

        const startIndex = startMatch.index + startMatch[0].length - 1; // Include opening brace

        // Count braces to find matching closing brace
        let braceCount = 0;
        let inString = false;
        let stringChar = null;
        let escaped = false;

        for (let i = startIndex; i < code.length; i++) {
            const char = code[i];

            // Handle escape sequences
            if (escaped) {
                escaped = false;
                continue;
            }
            if (char === '\\') {
                escaped = true;
                continue;
            }

            // Handle strings
            if (!inString && (char === '"' || char === "'" || char === '`')) {
                inString = true;
                stringChar = char;
                continue;
            }
            if (inString && char === stringChar) {
                inString = false;
                stringChar = null;
                continue;
            }

            // Count braces only outside of strings
            if (!inString) {
                if (char === '{') braceCount++;
                if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        // Found matching closing brace
                        return 'common: ' + code.slice(startIndex, i + 1);
                    }
                }
            }
        }

        return null;
    }

    /**
     * Extract character management code
     */
    extractCharacterManagement(code) {
        const sections = [];

        // Extract DOMContentLoaded event listener with character code
        const domContentMatch = code.match(
            /document\.addEventListener\s*\(\s*["']DOMContentLoaded["']\s*,\s*\(event\)\s*=>\s*{[\s\S]*?\.udl-character[\s\S]*?}\);/
        );
        if (domContentMatch) {
            sections.push(domContentMatch[0]);
        }

        // Extract $exeDevice.characters
        const exeDeviceMatch = code.match(
            /if\s*\(\s*typeof\s+\$exeDevice\s*!==\s*["']undefined["']\s*\)\s*{[\s\S]*?\$exeDevice\.characters[\s\S]*?}/
        );
        if (exeDeviceMatch) {
            sections.push(exeDeviceMatch[0]);
        }

        return sections.length > 0 ? sections.join('\n\n') : null;
    }

    /**
     * Extract H5P iframe resizer
     */
    extractH5PResizer(code) {
        // Find the H5P iframe resizer IIFE
        const h5pMatch = code.match(
            /\/\/ H5P iframe Resizer[\s\S]*?\(function\s*\(\)\s*{[\s\S]*?}\)\(\);/
        );
        return h5pMatch ? h5pMatch[0] : null;
    }

    /**
     * Extract phase management code from common.init
     */
    extractPhaseManagement(code) {
        // This is typically inside common.init, so we'll extract the whole common object
        // The phase management code is the part that deals with nodeDecoration classes
        const phaseMatch = code.match(
            /\/\/Phase management[\s\S]*?$("#nodeDecoration")\.addClass[\s\S]*?}/
        );
        return phaseMatch ? phaseMatch[0] : null;
    }

    /**
     * Integrate custom code into the new template
     */
    integrateCustomCode(newJS, customSections) {
        if (!customSections || customSections.length === 0) {
            return newJS;
        }

        let result = newJS;

        // Find the position to insert code
        const myThemeSections = customSections.filter(s => s.location === 'myTheme object');
        const afterCodeSections = customSections.filter(s => s.location === 'after main code');

        // Add functions to myTheme object
        if (myThemeSections.length > 0) {
            // Find the closing brace of params function (last standard function)
            const paramsEndMatch = result.match(/(params\s*:\s*function\s*\([^)]*\)\s*{[\s\S]*?}\s*,?\s*\n)/);
            if (paramsEndMatch) {
                const insertPos = paramsEndMatch.index + paramsEndMatch[0].length;
                const customFunctions = myThemeSections.map(s => {
                    const code = s.code;
                    // Ensure proper formatting and comma
                    return code.endsWith(',') ? code : code + ',';
                }).join('\n\n    ');

                result = result.slice(0, insertPos) + '\n    // === CUSTOM FUNCTIONS PRESERVED FROM v2.9 ===\n    ' + customFunctions + '\n' + result.slice(insertPos);
            }
        }

        // Add code after main initialization
        if (afterCodeSections.length > 0) {
            const customCode = afterCodeSections.map(s => s.code).join('\n\n');
            // Append after the last line
            result += '\n// === CUSTOM CODE PRESERVED FROM v2.9 ===\n';
            result += customCode + '\n';
        }

        return result;
    }

    /**
     * Get transformation summary
     */
    getSummary() {
        return {
            template: this.analysis.template,
            complexity: this.analysis.complexity,
            preservedCode: this.customCodeSections
        };
    }
}
