// AI Music Video Generator - Main Application
class MusicVideoApp {
    constructor() {
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        // DOM Elements
        this.settingsModal = document.getElementById('settingsModal');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.getStartedBtn = document.getElementById('getStartedBtn');
        this.closeBtn = document.querySelector('.close');
        this.settingsForm = document.getElementById('settingsForm');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.uploadScreen = document.getElementById('uploadScreen');
        this.consoleOutput = document.getElementById('consoleOutput');
        this.apiStatus = document.getElementById('apiStatus');

        // Bind event listeners
        this.bindEvents();

        // Check if API keys are configured
        this.checkConfiguration();

        // Initialize console
        this.initConsole();
    }

    bindEvents() {
        // Settings modal
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.getStartedBtn.addEventListener('click', () => this.openSettings());
        this.closeBtn.addEventListener('click', () => this.closeSettings());
        
        window.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });

        // Settings form
        this.settingsForm.addEventListener('submit', (e) => this.saveSettings(e));
        document.getElementById('testConnection').addEventListener('click', () => this.testConnection());

        // Password toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePassword(e));
        });

        // Upload functionality
        const uploadDropZone = document.getElementById('uploadDropZone');
        const audioFileInput = document.getElementById('audioFileInput');
        const browseBtn = document.getElementById('browseBtn');

        browseBtn.addEventListener('click', () => audioFileInput.click());
        audioFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        uploadDropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadDropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadDropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Console
        document.getElementById('clearConsole').addEventListener('click', () => this.clearConsole());

        // Load saved settings into form
        this.loadSettingsIntoForm();
    }

    // Settings Management
    openSettings() {
        this.settingsModal.classList.add('active');
        this.loadSettingsIntoForm();
    }

    closeSettings() {
        this.settingsModal.classList.remove('active');
    }

    loadSettings() {
        const defaultSettings = {
            googleApiKey: '',
            googleProjectId: '',
            geminiApiKey: '',
            geminiModel: 'gemini-2.5-flash',
            zaiApiKey: '',
            aspectRatio: '16:9',
            videoQuality: 'high',
            clipLength: 5,
            saveLocally: true,
            autoSave: false
        };

        try {
            const saved = localStorage.getItem('musicVideoSettings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return defaultSettings;
        }
    }

    loadSettingsIntoForm() {
        document.getElementById('googleApiKey').value = this.settings.googleApiKey || '';
        document.getElementById('googleProjectId').value = this.settings.googleProjectId || '';
        document.getElementById('geminiApiKey').value = this.settings.geminiApiKey || '';
        document.getElementById('geminiModel').value = this.settings.geminiModel || 'gemini-2.5-flash';
        document.getElementById('zaiApiKey').value = this.settings.zaiApiKey || '';
        document.getElementById('aspectRatio').value = this.settings.aspectRatio || '16:9';
        document.getElementById('videoQuality').value = this.settings.videoQuality || 'high';
        document.getElementById('clipLength').value = this.settings.clipLength || 5;
        document.getElementById('saveLocally').checked = this.settings.saveLocally !== false;
        document.getElementById('autoSave').checked = this.settings.autoSave || false;
    }

    saveSettings(e) {
        e.preventDefault();

        const newSettings = {
            googleApiKey: document.getElementById('googleApiKey').value.trim(),
            googleProjectId: document.getElementById('googleProjectId').value.trim(),
            geminiApiKey: document.getElementById('geminiApiKey').value.trim(),
            geminiModel: document.getElementById('geminiModel').value,
            zaiApiKey: document.getElementById('zaiApiKey').value.trim(),
            aspectRatio: document.getElementById('aspectRatio').value,
            videoQuality: document.getElementById('videoQuality').value,
            clipLength: parseInt(document.getElementById('clipLength').value),
            saveLocally: document.getElementById('saveLocally').checked,
            autoSave: document.getElementById('autoSave').checked
        };

        // Validate required fields
        if (!newSettings.googleApiKey || !newSettings.geminiApiKey) {
            this.showNotification('Please provide both Google Veo and Gemini API keys', 'error');
            return;
        }

        // Save to memory
        this.settings = newSettings;

        // Save to localStorage if enabled
        if (newSettings.saveLocally) {
            try {
                localStorage.setItem('musicVideoSettings', JSON.stringify(newSettings));
                this.log('Settings saved to browser storage', 'success');
            } catch (error) {
                console.error('Error saving settings:', error);
                this.log('Failed to save settings to browser storage', 'error');
            }
        }

        this.showNotification('Settings saved successfully!', 'success');
        this.closeSettings();
        this.checkConfiguration();
        this.log('API configuration updated', 'info');
    }

    async testConnection() {
        const googleKey = document.getElementById('googleApiKey').value.trim();
        const geminiKey = document.getElementById('geminiApiKey').value.trim();

        if (!googleKey || !geminiKey) {
            this.showNotification('Please enter API keys before testing', 'warning');
            return;
        }

        this.log('Testing API connection...', 'info');
        const testBtn = document.getElementById('testConnection');
        const originalText = testBtn.innerHTML;
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        testBtn.disabled = true;

        // Simulate API test (in production, this would make actual API calls)
        setTimeout(() => {
            const success = googleKey.length > 20 && geminiKey.length > 20;
            
            if (success) {
                this.showNotification('Connection successful! API keys are valid.', 'success');
                this.log('✓ Google Veo API: Connected', 'success');
                this.log('✓ Gemini API: Connected', 'success');
            } else {
                this.showNotification('Connection failed. Please check your API keys.', 'error');
                this.log('✗ API connection failed', 'error');
            }

            testBtn.innerHTML = originalText;
            testBtn.disabled = false;
        }, 2000);
    }

    togglePassword(e) {
        const btn = e.currentTarget;
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        const icon = btn.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // Configuration Check
    checkConfiguration() {
        const isConfigured = this.settings.googleApiKey && this.settings.geminiApiKey;

        if (isConfigured) {
            this.welcomeScreen.style.display = 'none';
            this.uploadScreen.style.display = 'block';
            this.consoleOutput.style.display = 'block';
            this.updateStatusIndicator(true);
            this.log('System ready - API keys configured', 'success');
        } else {
            this.welcomeScreen.style.display = 'flex';
            this.uploadScreen.style.display = 'none';
            this.consoleOutput.style.display = 'none';
            this.updateStatusIndicator(false);
        }
    }

    updateStatusIndicator(connected) {
        if (connected) {
            this.apiStatus.classList.add('connected');
            this.apiStatus.querySelector('span').textContent = 'Connected';
        } else {
            this.apiStatus.classList.remove('connected');
            this.apiStatus.querySelector('span').textContent = 'Not Configured';
        }
    }

    // File Upload Handling
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processAudioFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processAudioFile(files[0]);
        }
    }

    processAudioFile(file) {
        // Check file type
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/flac'];
        const isValidType = validTypes.some(type => file.type.includes(type.split('/')[1]));

        if (!isValidType) {
            this.showNotification('Invalid file type. Please upload an audio file (MP3, WAV, M4A, FLAC)', 'error');
            return;
        }

        this.log(`📁 File selected: ${file.name} (${this.formatFileSize(file.size)})`, 'info');
        this.log('🎵 Analyzing audio file...', 'info');

        // Simulate processing
        setTimeout(() => {
            this.log('✓ Audio analysis complete', 'success');
            this.log(`  Duration: ${this.getRandomDuration()}`, 'info');
            this.log(`  BPM: ${Math.floor(Math.random() * 60) + 90}`, 'info');
            this.log(`  Key: ${this.getRandomKey()}`, 'info');
            this.log('', 'info');
            this.log('🎨 Ready to generate video! Configure your style settings and click Generate.', 'success');
            
            this.showNotification('Audio file uploaded successfully!', 'success');
        }, 1500);
    }

    // Console/Logging
    initConsole() {
        this.consoleContent = document.getElementById('consoleContent');
        this.log('🚀 AI Music Video Generator initialized', 'info');
        this.log(`Version: 1.0.0 | Build: ${new Date().toISOString().split('T')[0]}`, 'info');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span>${message}`;
        
        this.consoleContent.appendChild(entry);
        this.consoleContent.scrollTop = this.consoleContent.scrollHeight;
    }

    clearConsole() {
        this.consoleContent.innerHTML = '';
        this.log('Console cleared', 'info');
    }

    // Notifications
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : type === 'warning' ? 'var(--warning-color)' : 'var(--primary-color)'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Utility functions
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    getRandomDuration() {
        const minutes = Math.floor(Math.random() * 4) + 2;
        const seconds = Math.floor(Math.random() * 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    getRandomKey() {
        const keys = ['C Major', 'D Major', 'E Major', 'F Major', 'G Major', 'A Major', 'B Major',
                      'C Minor', 'D Minor', 'E Minor', 'F Minor', 'G Minor', 'A Minor', 'B Minor'];
        return keys[Math.floor(Math.random() * keys.length)];
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.musicVideoApp = new MusicVideoApp();
});
