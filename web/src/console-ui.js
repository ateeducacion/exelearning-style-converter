/**
 * Browser-based console simulator
 * Displays colored output similar to terminal
 */
export class BrowserConsole {
    constructor(selector) {
        this.element = document.querySelector(selector);
        if (!this.element) {
            throw new Error(`Console element not found: ${selector}`);
        }
    }

    /**
     * Log a message with a specific type
     */
    log(message, type = 'info') {
        const line = document.createElement('div');
        line.className = `console-line console-${type}`;

        const timestamp = document.createElement('span');
        timestamp.className = 'console-timestamp';
        timestamp.textContent = `[${this.getTimestamp()}]`;

        const content = document.createElement('span');
        content.className = 'console-content';
        content.textContent = ` ${message}`;

        line.appendChild(timestamp);
        line.appendChild(content);

        this.element.appendChild(line);
        this.scrollToBottom();
    }

    /**
     * Info message (blue)
     */
    info(message) {
        this.log(message, 'info');
    }

    /**
     * Success message (green)
     */
    success(message) {
        this.log(`✓ ${message}`, 'success');
    }

    /**
     * Warning message (yellow)
     */
    warning(message) {
        this.log(`⚠ ${message}`, 'warning');
    }

    /**
     * Error message (red)
     */
    error(message) {
        this.log(`✗ ${message}`, 'error');
    }

    /**
     * Clear all messages
     */
    clear() {
        this.element.innerHTML = '';
    }

    /**
     * Scroll to bottom
     */
    scrollToBottom() {
        this.element.scrollTop = this.element.scrollHeight;
    }

    /**
     * Get current timestamp
     */
    getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Add a section separator
     */
    separator() {
        const line = document.createElement('div');
        line.className = 'console-separator';
        line.textContent = '═'.repeat(60);
        this.element.appendChild(line);
        this.scrollToBottom();
    }

    /**
     * Add a blank line
     */
    blank() {
        const line = document.createElement('div');
        line.className = 'console-line';
        line.innerHTML = '&nbsp;';
        this.element.appendChild(line);
        this.scrollToBottom();
    }
}
