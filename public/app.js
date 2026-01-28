class MusicVideoApp {
    constructor() {
        console.log('🚀 Initializing MusicVideoApp...');
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
                console.log('🔓 Opening settings modal...');
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
                console.log('🔓 Get Started button clicked...');
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
                    console.log('🔒 Closing settings modal...');
                    this.closeSettings();
                });
            }

            // Save settings
            if (saveSettings) {
                saveSettings.addEventListener('click', () => {
                    console.log('💾 Saving settings...');
                    this.saveSettingsForm();
                });
            }

            // Close modal on outside click
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    console.log('🔒 Closing modal (outside click)...');
                    this.closeSettings();
                }
            });

            console.log('✅ All event listeners bound successfully');

        } catch (error) {
            console.error('❌ Error binding events:', error);
            this.showNotification('Application initialization failed. Please refresh the page.', 'error');
        }

        // Check if API keys are configured
        this.checkApiKeys();
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        if (!modal) {
            throw new Error('Settings modal not found');
        }

        // Load current values
        document.getElementById('googleApiKey').value = this.apiKeys.openai || '';
        document.getElementById('zaiApiKey').value = this.apiKeys.zai || '';

        // Optional fields
        const googleProjectId = document.getElementById('googleProjectId');
        if (googleProjectId) googleProjectId.value = this.apiKeys.googleProjectId || '';
        
        const geminiApiKey = document.getElementById('geminiApiKey');
        if (geminiApiKey) geminiApiKey.value = this.apiKeys.geminiApiKey || '';

        modal.classList.add('active');
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    saveSettingsForm() {
        try {
            this.apiKeys.openai = document.getElementById('googleApiKey').value.trim();
            this.apiKeys.zai = document.getElementById('zaiApiKey').value.trim();

        // Optional fields
        const googleProjectId = document.getElementById('googleProjectId');
        if (googleProjectId) googleProjectId.value = this.apiKeys.googleProjectId || '';
        
        const geminiApiKey = document.getElementById('geminiApiKey');
        if (geminiApiKey) geminiApiKey.value = this.apiKeys.geminiApiKey || '';

            this.saveApiKeys();
            this.closeSettings();
            this.checkApiKeys();
            this.showNotification('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('❌ Error saving settings form:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    checkApiKeys() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const mainApp = document.getElementById('mainApp');

        if (!welcomeScreen || !mainApp) {
            console.warn('⚠️  Welcome screen or main app elements not found');
            return;
        }

        if (this.apiKeys.openai && this.apiKeys.zai) {
            welcomeScreen.style.display = 'none';
            mainApp.style.display = 'block';
            console.log('✅ API keys configured, showing main app');
        } else {
            welcomeScreen.style.display = 'flex';
            mainApp.style.display = 'none';
            console.log('⚠️  API keys not configured, showing welcome screen');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style it
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            backgroundColor: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6',
            color: 'white',
            zIndex: '10000',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.3s ease-out'
        });

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async generateVideo() {
        console.log('🎬 Starting video generation...');

        try {
            // Validate inputs
            const songUrl = document.getElementById('songUrl').value.trim();
            const prompt = document.getElementById('videoPrompt').value.trim();

            if (!songUrl || !prompt) {
                throw new Error('Please provide both a song URL and video prompt');
            }

            // Validate API keys
            if (!this.apiKeys.openai || !this.apiKeys.zai) {
                throw new Error('Please configure your API keys first');
            }

            this.showNotification('Starting video generation...', 'info');

            // TODO: Implement actual API calls here
            console.log('Song URL:', songUrl);
            console.log('Prompt:', prompt);

            // Placeholder for now
            this.showNotification('Video generation not yet implemented', 'info');

        } catch (error) {
            console.error('❌ Error generating video:', error);
            this.showNotification(error.message, 'error');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 DOM Content Loaded - Initializing app...');
    try {
        window.app = new MusicVideoApp();
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Fatal error initializing app:', error);
        alert('Application failed to initialize. Please refresh the page or contact support.');
    }
});