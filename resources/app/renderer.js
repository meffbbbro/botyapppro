// Import TelegramApi - will be loaded via script tag in HTML
// const { TelegramApi } = require('telegram');
// const { StringSession } = require('telegram/sessions');

class BotyProRenderer {
    constructor() {
        this.stopRequested = false;
        this.config = {};
        this.isConnected = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupIPCListeners();
        this.loadConfig();
        this.log('🎨 Welcome to BotyPro Enhanced - Electron Edition!');
    }

    initializeElements() {
        // Status elements
        this.connectionStatus = document.getElementById('connection-status');
        
        // Input elements
        this.apiIdInput = document.getElementById('api-id');
        this.apiHashInput = document.getElementById('api-hash');
        this.phoneNumberInput = document.getElementById('phone-number');
        this.sessionStringInput = document.getElementById('session-string');
        this.delayInput = document.getElementById('delay');
        this.repeatCyclesInput = document.getElementById('repeat-cycles');
        
        // Template elements
        this.templateInputs = [
            document.getElementById('template-1'),
            document.getElementById('template-2'),
            document.getElementById('template-3')
        ];
        
        // Button elements
        this.connectBtn = document.getElementById('connect-btn');
        this.refreshGroupsBtn = document.getElementById('refresh-groups-btn');
        this.startQueueBtn = document.getElementById('start-queue-btn');
        this.stopQueueBtn = document.getElementById('stop-queue-btn');
        this.clearLogBtn = document.getElementById('clear-log-btn');
        
        // Other elements
        this.groupsList = document.getElementById('groups-list');
        this.logDisplay = document.getElementById('log-display');
        this.progressContainer = document.getElementById('progress-container');
        this.progressFill = document.getElementById('progress-fill');
        
        // Modal elements
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalInput = document.getElementById('modal-input');
        this.modalCancel = document.getElementById('modal-cancel');
        this.modalConfirm = document.getElementById('modal-confirm');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Auto-save on input changes
        [this.apiIdInput, this.apiHashInput, this.phoneNumberInput, 
         this.sessionStringInput, this.delayInput, this.repeatCyclesInput].forEach(input => {
            input.addEventListener('blur', () => this.saveConfig());
        });

        this.templateInputs.forEach(template => {
            template.addEventListener('blur', () => this.saveConfig());
        });

        // Button events
        this.connectBtn.addEventListener('click', () => this.connectToTelegram());
        this.refreshGroupsBtn.addEventListener('click', () => this.populateGroups());
        this.startQueueBtn.addEventListener('click', () => this.startMessageQueue());
        this.stopQueueBtn.addEventListener('click', () => this.stopMessageQueue());
        this.clearLogBtn.addEventListener('click', () => this.clearLog());

        // Modal events
        this.modalCancel.addEventListener('click', () => this.hideModal(false));
        this.modalConfirm.addEventListener('click', () => this.hideModal(true));
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.hideModal(false);
        });

        // Enter key in modal
        this.modalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.hideModal(true);
        });
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }

    async loadConfig() {
        try {
            this.config = await window.electronAPI.loadConfig();
            
            // Populate form fields
            this.apiIdInput.value = this.config.api_id || '';
            this.apiHashInput.value = this.config.api_hash || '';
            this.phoneNumberInput.value = this.config.phone_number || '';
            this.sessionStringInput.value = this.config.session_string || '';
            this.delayInput.value = this.config.delay || 5;
            this.repeatCyclesInput.value = this.config.repeat_cycles || 1;
            
            // Populate templates
            this.templateInputs.forEach((template, index) => {
                template.value = this.config.message_templates[index] || '';
            });
            
            this.log('✅ Configuration loaded successfully');
        } catch (error) {
            this.log(`❌ Error loading config: ${error.message}`);
        }
    }

    async saveConfig() {
        try {
            this.config = {
                api_id: this.apiIdInput.value,
                api_hash: this.apiHashInput.value,
                phone_number: this.phoneNumberInput.value,
                session_string: this.sessionStringInput.value,
                delay: parseInt(this.delayInput.value) || 5,
                repeat_cycles: parseInt(this.repeatCyclesInput.value) || 1,
                message_templates: this.templateInputs.map(t => t.value),
                checked_groups: this.getCheckedGroups()
            };
            
            await window.electronAPI.saveConfig(this.config);
        } catch (error) {
            this.log(`❌ Error saving config: ${error.message}`);
        }
    }

    getCheckedGroups() {
        const checkedGroups = [];
        document.querySelectorAll('.group-item input[type="checkbox"]:checked').forEach(checkbox => {
            checkedGroups.push(checkbox.dataset.groupName);
        });
        return checkedGroups;
    }

    setConnectionStatus(text, type = 'normal') {
        this.connectionStatus.textContent = text;
        this.connectionStatus.className = 'status-label';
        
        if (type !== 'normal') {
            this.connectionStatus.classList.add(type);
        }
        
        // Add emoji based on type
        const emojis = {
            'connected': '✨',
            'error': '💥',
            'loading': '⏳'
        };
        
        if (emojis[type]) {
            this.connectionStatus.textContent = `${emojis[type]} ${text}`;
        }
    }

    setupIPCListeners() {
        // Listen for input requests from main process
        window.electronAPI.onRequestInput((event, data) => {
            this.showInputDialog(data.title, data.message, data.isPassword).then(input => {
                window.electronAPI.sendInputResponse(data.callback, input);
            }).catch(() => {
                window.electronAPI.sendInputResponse(data.callback, '');
            });
        });

        // Listen for queue progress updates
        window.electronAPI.onQueueProgress((event, data) => {
            if (data.success) {
                this.log(`✅ Sent to ${data.group}: ${data.message}...`);
            } else {
                this.log(`❌ Error sending to ${data.group}: ${data.error}`);
            }
            
            // Update progress bar
            if (data.progress && data.total) {
                this.updateProgress(data.progress, data.total);
            }
        });
    }

    async connectToTelegram() {
        try {
            this.setConnectionStatus('Connecting...', 'loading');
            
            const apiId = this.apiIdInput.value.trim();
            const apiHash = this.apiHashInput.value.trim();
            const phoneNumber = this.phoneNumberInput.value.trim();
            const sessionString = this.sessionStringInput.value.trim();

            if (!apiId || !apiHash || !phoneNumber) {
                this.setConnectionStatus('Missing credentials', 'error');
                this.log('❌ Please fill in all required fields');
                return;
            }

            // Connect via main process
            const result = await window.electronAPI.connectTelegram({
                apiId,
                apiHash,
                phoneNumber,
                sessionString
            });

            if (result.success) {
                this.isConnected = true;
                this.setConnectionStatus('Connected', 'connected');
                this.log('✅ Successfully connected to Telegram');
                
                // Save session string if provided
                if (result.sessionString) {
                    this.sessionStringInput.value = result.sessionString;
                    await this.saveConfig();
                }
                
                // Auto-populate groups
                await this.populateGroups();
            } else {
                this.isConnected = false;
                this.setConnectionStatus('Connection failed', 'error');
                this.log(`❌ Connection error: ${result.error}`);
            }

        } catch (error) {
            this.isConnected = false;
            this.setConnectionStatus('Connection failed', 'error');
            this.log(`❌ Connection error: ${error.message}`);
        }
    }

    async populateGroups() {
        if (!this.isConnected) {
            this.log('❌ Not connected to Telegram');
            return;
        }

        try {
            this.log('🔄 Loading groups...');
            
            const result = await window.electronAPI.getGroups();
            
            if (result.success) {
                this.groupsList.innerHTML = '';
                
                for (const group of result.groups) {
                    const groupItem = document.createElement('div');
                    groupItem.className = 'group-item';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.dataset.groupName = group.name;
                    checkbox.addEventListener('change', () => this.saveConfig());
                    
                    // Check if this group was previously selected
                    if (this.config.checked_groups && this.config.checked_groups.includes(group.name)) {
                        checkbox.checked = true;
                    }
                    
                    const label = document.createElement('span');
                    label.textContent = group.name;
                    
                    groupItem.appendChild(checkbox);
                    groupItem.appendChild(label);
                    this.groupsList.appendChild(groupItem);
                }
                
                this.log(`✅ Loaded ${result.groups.length} groups`);
            } else {
                this.log(`❌ Error loading groups: ${result.error}`);
            }
            
        } catch (error) {
            this.log(`❌ Error loading groups: ${error.message}`);
        }
    }

    async startMessageQueue() {
        try {
            this.stopRequested = false;
            this.startQueueBtn.style.display = 'none';
            this.stopQueueBtn.style.display = 'inline-block';
            this.progressContainer.style.display = 'block';

            // Get selected groups
            const selectedGroups = [];
            document.querySelectorAll('.group-item input[type="checkbox"]:checked').forEach(checkbox => {
                selectedGroups.push(checkbox.dataset.groupName);
            });

            if (selectedGroups.length === 0) {
                this.log('❌ No groups selected');
                this.resetQueueButtons();
                return;
            }

            // Get messages
            const messages = this.templateInputs
                .map(template => template.value.trim())
                .filter(msg => msg.length > 0);

            if (messages.length === 0) {
                this.log('❌ No messages to send');
                this.resetQueueButtons();
                return;
            }

            const delay = parseInt(this.delayInput.value) || 5;
            const cycles = parseInt(this.repeatCyclesInput.value) || 1;
            
            this.log(`🚀 Starting queue: ${selectedGroups.length} groups, ${messages.length} messages, ${cycles} cycles`);

            // Send messages via main process
            const result = await window.electronAPI.sendMessages({
                selectedGroups,
                messages,
                delay,
                cycles
            });

            if (result.success) {
                this.log('🎉 Message queue completed successfully!');
            } else {
                this.log(`❌ Queue error: ${result.error}`);
            }

        } catch (error) {
            this.log(`❌ Queue error: ${error.message}`);
        } finally {
            this.resetQueueButtons();
        }
    }

    stopMessageQueue() {
        this.stopRequested = true;
        this.log('⏹️ Stopping message queue...');
    }

    resetQueueButtons() {
        this.startQueueBtn.style.display = 'inline-block';
        this.stopQueueBtn.style.display = 'none';
        this.progressContainer.style.display = 'none';
        this.stopRequested = false;
    }

    updateProgress(current, total) {
        const percentage = (current / total) * 100;
        this.progressFill.style.width = `${percentage}%`;
        this.progressFill.textContent = `${current}/${total} (${Math.round(percentage)}%)`;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message) {
        const timestamp = new Date().toLocaleString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        // Add styling based on message type
        if (message.includes('✅')) {
            logEntry.classList.add('success');
        } else if (message.includes('❌')) {
            logEntry.classList.add('error');
        } else if (message.includes('⚠️')) {
            logEntry.classList.add('warning');
        }
        
        this.logDisplay.appendChild(logEntry);
        this.logDisplay.scrollTop = this.logDisplay.scrollHeight;
    }

    clearLog() {
        this.logDisplay.innerHTML = '';
        this.log('🧹 Log cleared');
    }

    async showInputDialog(title, message, isPassword = false) {
        return new Promise((resolve, reject) => {
            this.modalTitle.textContent = title;
            this.modalMessage.textContent = message;
            this.modalInput.type = isPassword ? 'password' : 'text';
            this.modalInput.value = '';
            this.modalOverlay.style.display = 'flex';
            this.modalInput.focus();

            this.modalResolve = resolve;
            this.modalReject = reject;
        });
    }

    hideModal(confirmed) {
        this.modalOverlay.style.display = 'none';
        
        if (confirmed && this.modalResolve) {
            this.modalResolve(this.modalInput.value);
        } else if (this.modalReject) {
            this.modalReject(new Error('Dialog cancelled'));
        }
        
        this.modalResolve = null;
        this.modalReject = null;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.botyPro = new BotyProRenderer();
});

// Handle window close
window.addEventListener('beforeunload', () => {
    if (window.botyPro) {
        window.botyPro.saveConfig();
    }
});
