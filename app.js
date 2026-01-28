class DebugLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
        this.isVisible = false;
        this.createUI();
        this.startMonitoring();
        console.log('🐛 Debug Logger initialized');
    }

    createUI() {
        // Create debug panel
        const panel = document.createElement('div');
        panel.id = 'debug-logger-panel';
        panel.innerHTML = `
            <div class="debug-header">
                <h3>🐛 Debug Logger</h3>
                <div class="debug-controls">
                    <button id="debug-clear">Clear</button>
                    <button id="debug-export">Export</button>
                    <button id="debug-close">Close</button>
                </div>
            </div>
            <div class="debug-filters">
                <label><input type="checkbox" class="debug-filter" data-level="log" checked> Log</label>
                <label><input type="checkbox" class="debug-filter" data-level="warn" checked> Warn</label>
                <label><input type="checkbox" class="debug-filter" data-level="error" checked> Error</label>
                <label><input type="checkbox" class="debug-filter" data-level="event" checked> Events</label>
                <label><input type="checkbox" class="debug-filter" data-level="dom" checked> DOM</label>
            </div>
            <div id="debug-log-container" class="debug-logs"></div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #debug-logger-panel {
                position: fixed;
                top: 50px;
                right: 20px;
                width: 600px;
                max-height: 80vh;
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #00ff88;
                border-radius: 8px;
                color: #fff;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 100000;
                display: none;
                flex-direction: column;
                box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
            }
            #debug-logger-panel.visible {
                display: flex;
            }
            .debug-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background: #1a1a1a;
                border-bottom: 1px solid #00ff88;
            }
            .debug-header h3 {
                margin: 0;
                color: #00ff88;
                font-size: 14px;
            }
            .debug-controls button {
                background: #333;
                color: #fff;
                border: 1px solid #555;
                padding: 4px 10px;
                margin-left: 5px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
            }
            .debug-controls button:hover {
                background: #444;
                border-color: #00ff88;
            }
            .debug-filters {
                padding: 8px 15px;
                background: #222;
                border-bottom: 1px solid #444;
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
            }
            .debug-filters label {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 11px;
                cursor: pointer;
            }
            .debug-logs {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
            }
            .debug-log-entry {
                padding: 6px 10px;
                margin-bottom: 4px;
                border-radius: 4px;
                border-left: 3px solid #555;
                background: rgba(255, 255, 255, 0.05);
                word-wrap: break-word;
            }
            .debug-log-entry.log {
                border-left-color: #00ff88;
            }
            .debug-log-entry.warn {
                border-left-color: #ffaa00;
                background: rgba(255, 170, 0, 0.1);
            }
            .debug-log-entry.error {
                border-left-color: #ff3366;
                background: rgba(255, 51, 102, 0.1);
            }
            .debug-log-entry.event {
                border-left-color: #3388ff;
            }
            .debug-log-entry.dom {
                border-left-color: #ff33ff;
            }
            .debug-timestamp {
                color: #888;
                font-size: 10px;
                margin-right: 8px;
            }
            .debug-level {
                font-weight: bold;
                margin-right: 8px;
                text-transform: uppercase;
            }
            .debug-message {
                color: #fff;
            }
            .debug-data {
                margin-top: 4px;
                padding: 6px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 3px;
                font-size: 11px;
                color: #00ff88;
                white-space: pre-wrap;
                overflow-x: auto;
            }
            #debug-toggle-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #00ff88;
                color: #000;
                border: none;
                font-size: 24px;
                cursor: pointer;
                z-index: 99999;
                box-shadow: 0 2px 10px rgba(0, 255, 136, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #debug-toggle-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 20px rgba(0, 255, 136, 0.8);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(panel);
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'debug-toggle-btn';
        toggleBtn.innerHTML = '🐛';
        toggleBtn.title = 'Toggle Debug Logger';
        document.body.appendChild(toggleBtn);
        
        this.panel = panel;
        this.container = panel.querySelector('#debug-log-container');
        
        // Bind events
        toggleBtn.addEventListener('click', () => this.toggle());
        panel.querySelector('#debug-clear').addEventListener('click', () => this.clear());
        panel.querySelector('#debug-export').addEventListener('click', () => this.export());
        panel.querySelector('#debug-close').addEventListener('click', () => this.hide());
        
        panel.querySelectorAll('.debug-filter').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.applyFilters());
        });
    }

    startMonitoring() {
        // Override console methods
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        console.log = (...args) => {
            originalLog.apply(console, args);
            this.log('log', args);
        };
        
        console.warn = (...args) => {
            originalWarn.apply(console, args);
            this.log('warn', args);
        };
        
        console.error = (...args) => {
            originalError.apply(console, args);
            this.log('error', args);
        };
        
        // Monitor all clicks
        document.addEventListener('click', (e) => {
            this.log('event', [`Click on: ${e.target.tagName}`, {
                id: e.target.id,
                className: e.target.className,
                innerText: e.target.innerText?.substring(0, 50)
            }]);
        }, true);
        
        // Monitor DOM mutations
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.id) {
                            this.log('dom', [`Element added: ${node.tagName}#${node.id}`]);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Monitor errors
        window.addEventListener('error', (e) => {
            this.log('error', [`Uncaught Error: ${e.message}`, {
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error?.stack
            }]);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.log('error', [`Unhandled Promise Rejection: ${e.reason}`]);
        });
    }

    log(level, args) {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });
        const entry = {
            timestamp,
            level,
            message: args[0]?.toString() || '',
            data: args.length > 1 ? args.slice(1) : null
        };
        
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        this.renderLog(entry);
    }

    renderLog(entry) {
        const logEl = document.createElement('div');
        logEl.className = `debug-log-entry ${entry.level}`;
        logEl.dataset.level = entry.level;
        
        let html = `
            <span class="debug-timestamp">${entry.timestamp}</span>
            <span class="debug-level">${entry.level}</span>
            <span class="debug-message">${this.escapeHtml(entry.message)}</span>
        `;
        
        if (entry.data) {
            try {
                const dataStr = entry.data.map(d => 
                    typeof d === 'object' ? JSON.stringify(d, null, 2) : String(d)
                ).join('\n');
                html += `<div class="debug-data">${this.escapeHtml(dataStr)}</div>`;
            } catch (e) {
                html += `<div class="debug-data">Unable to stringify data</div>`;
            }
        }
        
        logEl.innerHTML = html;
        this.container.appendChild(logEl);
        this.container.scrollTop = this.container.scrollHeight;
        
        this.applyFilters();
    }

    applyFilters() {
        const activeFilters = new Set();
        this.panel.querySelectorAll('.debug-filter:checked').forEach(cb => {
            activeFilters.add(cb.dataset.level);
        });
        
        this.container.querySelectorAll('.debug-log-entry').forEach(entry => {
            entry.style.display = activeFilters.has(entry.dataset.level) ? 'block' : 'none';
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.panel.classList.toggle('visible', this.isVisible);
        if (this.isVisible) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    }

    show() {
        this.isVisible = true;
        this.panel.classList.add('visible');
    }

    hide() {
        this.isVisible = false;
        this.panel.classList.remove('visible');
    }

    clear() {
        this.logs = [];
        this.container.innerHTML = '';
        console.log('🧹 Debug logs cleared');
    }

    export() {
        const data = {
            timestamp: new Date().toISOString(),
            logs: this.logs,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-log-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('📦 Debug logs exported');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize debug logger FIRST
const debugLogger = new DebugLogger();
console.log('🚀 Debug Logger ready - Click the 🐛 button in bottom-right corner');

class MusicVideoApp {
    constructor() {
        console.log('🎬 Initializing MusicVideoApp...');
        this.apiKeys = this.loadApiKeys();
        this.currentProject = null;
        this.bindEvents();
    }

    loadApiKeys() {
        try {
            const keys = localStorage.getItem('apiKeys');
            return keys ? JSON.parse(keys) : {};
        } catch (error) {
            console.error('❌ Error loading API keys:', error);
            return {};
        }
    }

    saveApiKeys() {
        try {
            localStorage.setItem('apiKeys', JSON.stringify(this.apiKeys));
            console.log('✅ API keys saved successfully');
        } catch (error) {
            console.error('❌ Error saving API keys:', error);
            this.showNotification('Failed to save API keys', 'error');
        }
    }

    bindEvents() {
        console.log('🎯 Binding events...');

        try {
            // Get all critical elements
            const settingsBtn = document.getElementById('settingsBtn');
            const getStartedBtn = document.getElementById('getStartedBtn');
            const settingsModal = document.getElementById('settingsModal');
            const closeModal = document.getElementById('closeModal');
            const saveSettings = document.getElementById('saveSettings');

            // Debug: Log what we found
            console.log('Element check:', {
                settingsBtn: !!settingsBtn,
                getStartedBtn: !!getStartedBtn,
                settingsModal: !!settingsModal,
                closeModal: !!closeModal,
                saveSettings: !!saveSettings
            });

            // Validate critical elements exist
            if (!settingsBtn || !getStartedBtn || !settingsModal) {
                throw new Error('❌ Critical elements not found! Check element IDs in HTML.');
            }

            console.log('✅ All critical elements found');

            // Settings button click
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔧 Opening settings modal...');
                try {
                    this.openSettings();
                    console.log('✅ Settings modal opened successfully');
                } catch (error) {
                    console.error('❌ Error opening settings:', error);
                    this.showNotification('Failed to open settings', 'error');
                }
            });

            // Get Started button click
            getStartedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔧 Get Started button clicked...');
                try {
                    this.openSettings();
                    console.log('✅ Settings modal opened from Get Started');
                } catch (error) {
                    console.error('❌ Error opening settings from Get Started:', error);
                    this.showNotification('Failed to open settings', 'error');
                }
            });

            // Close modal
            if (closeModal) {
                closeModal.addEventListener('click', () => {
                    console.log('❌ Closing settings modal...');
                    settingsModal.classList.remove('active');
                });
            }

            // Save settings
            if (saveSettings) {
                saveSettings.addEventListener('click', () => {
                    console.log('💾 Save Settings button clicked');
                    try {
                        this.saveSettings();
                    } catch (error) {
                        console.error('❌ Error in saveSettings:', error);
                        this.showNotification('Failed to save settings', 'error');
                    }
                });
            }

            // Close modal when clicking outside
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    console.log('❌ Closing modal (clicked outside)');
                    settingsModal.classList.remove('active');
                }
            });

            console.log('✅ All events bound successfully');

        } catch (error) {
            console.error('❌ Fatal error in bindEvents:', error);
            this.showNotification('Failed to initialize app controls', 'error');
        }
    }

    openSettings() {
        console.log('🔧 openSettings() called');
        try {
            const modal = document.getElementById('settingsModal');
            if (!modal) {
                throw new Error('Settings modal element not found!');
            }

            // Get input elements - with null safety
            const googleApiKeyInput = document.getElementById('googleApiKey');
            const geminiApiKeyInput = document.getElementById('geminiApiKey');

            console.log('Input elements found:', {
                googleApiKey: !!googleApiKeyInput,
                geminiApiKey: !!geminiApiKeyInput
            });

            // Safely populate existing values
            if (googleApiKeyInput && this.apiKeys.googleVeo) {
                googleApiKeyInput.value = this.apiKeys.googleVeo;
                console.log('✅ Populated Google Veo API key');
            }

            if (geminiApiKeyInput && this.apiKeys.gemini) {
                geminiApiKeyInput.value = this.apiKeys.gemini;
                console.log('✅ Populated Gemini API key');
            }

            // Show modal
            modal.classList.add('active');
            console.log('✅ Settings modal displayed');

        } catch (error) {
            console.error('❌ Error in openSettings:', error);
            throw error;
        }
    }

    saveSettings() {
        console.log('💾 saveSettings() called');
        try {
            // Get input elements - with null safety
            const googleApiKeyInput = document.getElementById('googleApiKey');
            const geminiApiKeyInput = document.getElementById('geminiApiKey');

            console.log('Attempting to save from inputs:', {
                googleApiKeyInput: !!googleApiKeyInput,
                geminiApiKeyInput: !!geminiApiKeyInput
            });

            // Only update if elements exist
            if (googleApiKeyInput) {
                const newValue = googleApiKeyInput.value.trim();
                if (newValue) {
                    this.apiKeys.googleVeo = newValue;
                    console.log('✅ Updated Google Veo API key');
                }
            } else {
                console.warn('⚠️ Google API key input not found');
            }

            if (geminiApiKeyInput) {
                const newValue = geminiApiKeyInput.value.trim();
                if (newValue) {
                    this.apiKeys.gemini = newValue;
                    console.log('✅ Updated Gemini API key');
                }
            } else {
                console.warn('⚠️ Gemini API key input not found');
            }

            // Save to localStorage
            this.saveApiKeys();

            // Close modal
            const modal = document.getElementById('settingsModal');
            if (modal) {
                modal.classList.remove('active');
                console.log('✅ Settings modal closed');
            }

            this.showNotification('Settings saved successfully!', 'success');
            console.log('✅ saveSettings() completed successfully');

        } catch (error) {
            console.error('❌ Error in saveSettings:', error);
            throw error;
        }
    }

    showNotification(message, type = 'info') {
        console.log(`📢 Notification [${type}]: ${message}`);
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff3366' : '#3388ff'};
            color: ${type === 'success' ? '#000' : '#fff'};
            border-radius: 8px;
            z-index: 10001;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM Content Loaded');
        window.app = new MusicVideoApp();
    });
} else {
    console.log('📄 DOM already loaded');
    window.app = new MusicVideoApp();
}
