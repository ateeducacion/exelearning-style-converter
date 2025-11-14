import fs from 'fs-extra';
import path from 'path';

/**
 * Build script to embed templates into JavaScript module
 */
async function buildTemplates() {
    const templateNames = ['base', 'neo'];
    const templates = {};

    for (const name of templateNames) {
        const templatePath = path.join('styles-new', name);

        const jsPath = path.join(templatePath, 'style.js');
        const cssPath = path.join(templatePath, 'style.css');
        const configPath = path.join(templatePath, 'config.xml');

        templates[name] = {
            js: await fs.readFile(jsPath, 'utf-8'),
            css: await fs.readFile(cssPath, 'utf-8'),
            config: await fs.readFile(configPath, 'utf-8')
        };
    }

    // Generate JavaScript module
    const output = `// Auto-generated templates - DO NOT EDIT MANUALLY
// Run 'node build-templates.js' to regenerate

export const templates = ${JSON.stringify(templates, null, 2)};
`;

    await fs.writeFile('web/src/templates.js', output, 'utf-8');
    console.log('✓ Templates embedded successfully');
    console.log(`  - ${Object.keys(templates).length} templates`);
    console.log(`  - Output: web/src/templates.js`);
}

buildTemplates().catch(console.error);
