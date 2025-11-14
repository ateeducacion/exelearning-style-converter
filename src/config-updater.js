import fs from 'fs-extra';
import path from 'path';
import xml2js from 'xml2js';

/**
 * Updates config.xml from v2.9 to v3.0 format
 */
export class ConfigUpdater {
    constructor(inputPath, styleName) {
        this.inputPath = inputPath;
        this.styleName = styleName;
        this.changes = [];
    }

    /**
     * Main update method
     */
    async update() {
        const configPath = path.join(this.inputPath, 'config.xml');

        if (!await fs.pathExists(configPath)) {
            throw new Error(`config.xml not found in ${this.inputPath}`);
        }

        // Read and parse old config.xml
        const oldContent = await fs.readFile(configPath, 'utf-8');
        const parser = new xml2js.Parser();
        const oldConfig = await parser.parseStringPromise(oldContent);

        // Extract metadata from old config
        const metadata = this.extractMetadata(oldConfig);

        // Generate new config.xml in v3.0 format
        const newConfig = this.generateNewConfig(metadata);

        return {
            content: newConfig,
            changes: this.changes,
            metadata
        };
    }

    /**
     * Extract metadata from old config
     */
    extractMetadata(config) {
        const theme = config.theme || {};
        const metadata = {};

        // Extract all fields
        const fields = ['name', 'title', 'version', 'compatibility', 'author',
                       'author-url', 'license', 'license-url', 'description',
                       'downloadable'];

        for (const field of fields) {
            if (theme[field] && theme[field][0]) {
                metadata[field] = theme[field][0];
            }
        }

        // If no title, use name
        if (!metadata.title && metadata.name) {
            metadata.title = metadata.name;
            this.changes.push({
                type: 'field-added',
                field: 'title',
                value: metadata.name,
                description: 'Added title field based on name'
            });
        }

        // Update version to 2025 (v3.0 standard)
        const oldVersion = metadata.version;
        metadata.version = '2025';
        if (oldVersion !== '2025') {
            this.changes.push({
                type: 'field-updated',
                field: 'version',
                oldValue: oldVersion,
                newValue: '2025',
                description: 'Updated version to v3.0 standard'
            });
        }

        // Update compatibility to 3.0
        const oldCompatibility = metadata.compatibility;
        metadata.compatibility = '3.0';
        if (oldCompatibility !== '3.0') {
            this.changes.push({
                type: 'field-updated',
                field: 'compatibility',
                oldValue: oldCompatibility,
                newValue: '3.0',
                description: 'Updated compatibility to 3.0'
            });
        }

        // Add downloadable if not present
        if (!metadata.downloadable) {
            metadata.downloadable = '1';
            this.changes.push({
                type: 'field-added',
                field: 'downloadable',
                value: '1',
                description: 'Added downloadable field'
            });
        }

        // Check for deprecated fields
        const deprecatedFields = ['extra-head', 'extra-body', 'edition-extra-head'];
        for (const field of deprecatedFields) {
            if (theme[field]) {
                this.changes.push({
                    type: 'field-removed',
                    field: field,
                    description: `Removed deprecated ${field} field (JavaScript is now auto-loaded)`
                });
            }
        }

        return metadata;
    }

    /**
     * Generate new config.xml in v3.0 format
     */
    generateNewConfig(metadata) {
        const fields = [
            { key: 'name', value: metadata.name || this.styleName },
            { key: 'title', value: metadata.title || metadata.name || this.styleName },
            { key: 'version', value: metadata.version || '2025' },
            { key: 'compatibility', value: '3.0' },
            { key: 'author', value: metadata.author || 'Unknown' },
            { key: 'author-url', value: metadata['author-url'] || '', optional: true },
            { key: 'license', value: metadata.license || 'Creative Commons by-sa' },
            { key: 'license-url', value: metadata['license-url'] || 'http://creativecommons.org/licenses/by-sa/3.0/' },
            { key: 'description', value: metadata.description || 'Converted from v2.9 to v3.0' },
            { key: 'downloadable', value: metadata.downloadable || '1' }
        ];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<theme>\n';

        for (const field of fields) {
            // Skip optional fields if empty
            if (field.optional && !field.value) {
                continue;
            }

            const value = this.escapeXml(field.value);
            xml += `    <${field.key}>${value}</${field.key}>\n`;
        }

        xml += '</theme>\n';

        return xml;
    }

    /**
     * Escape XML special characters
     */
    escapeXml(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Get a summary of changes
     */
    getSummary() {
        return {
            totalChanges: this.changes.length,
            fieldsAdded: this.changes.filter(c => c.type === 'field-added').length,
            fieldsUpdated: this.changes.filter(c => c.type === 'field-updated').length,
            fieldsRemoved: this.changes.filter(c => c.type === 'field-removed').length
        };
    }
}
