const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

class BotyProMain {
    constructor() {
        this.mainWindow = null;
        this.configPath = path.join(__dirname, 'botypro_config.json');
        this.client = null;
        this.isConnected = false;
        this.groupEntityMap = new Map();
    }

    async createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 750,
            minWidth: 1000,
            minHeight: 700,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js'),
                webSecurity: true,
                // Fix GPU and cache issues
                experimentalFeatures: false,
                backgroundThrottling: false
            },
            // icon: path.join(__dirname, 'assets', 'icon.png'), // Commented out since file doesn't exist
            show: false,
            titleBarStyle: 'default',
            backgroundColor: '#0a0e1a'
        });

        await this.mainWindow.loadFile('index.html');
        
        // Show window immediately and also when ready
        this.mainWindow.show();
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            this.mainWindow.focus();
        });

        // Open DevTools in development
        if (process.argv.includes('--dev')) {
            this.mainWindow.webContents.openDevTools();
        }

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    async loadConfig() {
        try {
            const data = await fs.readFile(this.configPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log('Config file not found, creating default config');
            return {
                api_id: '',
                api_hash: '',
                phone_number: '',
                session_string: '',
                delay: 5,
                repeat_cycles: 1,
                message_templates: ['', '', ''],
                checked_groups: []
            };
        }
    }

    async saveConfig(config) {
        try {
            await fs.writeFile(this.configPath, JSON.stringify(config, null, 4));
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            return false;
        }
    }

    async connectToTelegram(credentials) {
        try {
            const { apiId, apiHash, phoneNumber, sessionString } = credentials;
            
            const session = sessionString ? new StringSession(sessionString) : new StringSession('');
            this.client = new TelegramClient(session, parseInt(apiId), apiHash, {
                connectionRetries: 5,
                useWSS: false
            });

            await this.client.start({
                phoneNumber: async () => phoneNumber,
                password: async () => {
                    return new Promise((resolve) => {
                        this.mainWindow.webContents.send('request-input', {
                            title: 'Two-Factor Authentication',
                            message: 'Enter your 2FA password:',
                            isPassword: true,
                            callback: 'password-response'
                        });
                        ipcMain.once('password-response', (event, response) => {
                            resolve(response);
                        });
                    });
                },
                phoneCode: async () => {
                    return new Promise((resolve) => {
                        this.mainWindow.webContents.send('request-input', {
                            title: 'Verification Code',
                            message: 'Enter the code sent to your phone:',
                            isPassword: false,
                            callback: 'phonecode-response'
                        });
                        ipcMain.once('phonecode-response', (event, response) => {
                            resolve(response);
                        });
                    });
                },
                onError: (err) => {
                    console.error('Authentication error:', err);
                    throw err;
                }
            });

            this.isConnected = true;
            const newSessionString = this.client.session.save();
            
            return { success: true, sessionString: newSessionString };
        } catch (error) {
            this.isConnected = false;
            return { success: false, error: error.message };
        }
    }

    async getGroups() {
        if (!this.client || !this.isConnected) {
            return { success: false, error: 'Not connected to Telegram' };
        }

        try {
            const dialogs = await this.client.getDialogs();
            const groups = [];
            this.groupEntityMap.clear();
            
            for (const dialog of dialogs) {
                if (dialog.isGroup || dialog.isChannel) {
                    const groupInfo = { name: dialog.title, id: dialog.id };
                    groups.push(groupInfo);
                    this.groupEntityMap.set(dialog.title, dialog);
                }
            }
            
            return { success: true, groups };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async sendMessages(params) {
        const { selectedGroups, messages, delay, cycles } = params;
        
        if (!this.client || !this.isConnected) {
            return { success: false, error: 'Not connected to Telegram' };
        }

        try {
            const results = [];
            const totalMessages = selectedGroups.length * cycles;
            let progress = 0;
            
            for (let cycle = 0; cycle < cycles; cycle++) {
                for (const groupName of selectedGroups) {
                    const groupEntity = this.groupEntityMap.get(groupName);
                    if (!groupEntity) {
                        progress++;
                        continue;
                    }
                    
                    // Randomly pick one message from the available messages
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    
                    try {
                        await this.client.sendMessage(groupEntity, { message: randomMessage });
                        results.push({ success: true, group: groupName, message: randomMessage.substring(0, 50) });
                        
                        // Send progress update to renderer
                        progress++;
                        this.mainWindow.webContents.send('queue-progress', {
                            group: groupName,
                            message: randomMessage.substring(0, 50),
                            success: true,
                            progress: progress,
                            total: totalMessages
                        });
                        
                        if (delay > 0) {
                            await new Promise(resolve => setTimeout(resolve, delay * 1000));
                        }
                    } catch (error) {
                        results.push({ success: false, group: groupName, error: error.message });
                        progress++;
                        this.mainWindow.webContents.send('queue-progress', {
                            group: groupName,
                            message: randomMessage.substring(0, 50),
                            success: false,
                            error: error.message,
                            progress: progress,
                            total: totalMessages
                        });
                    }
                }
            }
            
            return { success: true, results };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    setupIpcHandlers() {
        ipcMain.handle('load-config', async () => {
            return await this.loadConfig();
        });

        ipcMain.handle('save-config', async (event, config) => {
            return await this.saveConfig(config);
        });

        ipcMain.handle('connect-telegram', async (event, credentials) => {
            return await this.connectToTelegram(credentials);
        });

        ipcMain.handle('get-groups', async () => {
            return await this.getGroups();
        });

        ipcMain.handle('send-messages', async (event, params) => {
            return await this.sendMessages(params);
        });

        ipcMain.handle('show-message-box', async (event, options) => {
            const result = await dialog.showMessageBox(this.mainWindow, options);
            return result;
        });

        ipcMain.handle('show-input-dialog', async (event, options) => {
            // Input dialogs are handled by the renderer process through the modal
            return new Promise((resolve) => {
                this.mainWindow.webContents.send('request-input', {
                    title: options.title || 'Input',
                    message: options.message || 'Enter value:',
                    isPassword: options.isPassword || false,
                    callback: 'input-dialog-response'
                });
                ipcMain.once('input-dialog-response', (event, response) => {
                    resolve({ cancelled: !response, input: response || '' });
                });
            });
        });
    }

    async initialize() {
        // Add command line switches to fix GPU and cache issues
        app.commandLine.appendSwitch('disable-gpu');
        app.commandLine.appendSwitch('disable-gpu-sandbox');
        app.commandLine.appendSwitch('disable-software-rasterizer');
        app.commandLine.appendSwitch('disable-gpu-memory-buffer-compositor-resources');
        app.commandLine.appendSwitch('disable-gpu-compositing');
        app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
        app.commandLine.appendSwitch('disable-accelerated-jpeg-decoding');
        app.commandLine.appendSwitch('disable-accelerated-mjpeg-decode');
        app.commandLine.appendSwitch('disable-accelerated-video-decode');
        app.commandLine.appendSwitch('no-sandbox');
        app.commandLine.appendSwitch('disable-dev-shm-usage');
        app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
        app.commandLine.appendSwitch('disable-web-security');
        app.commandLine.appendSwitch('disable-features', 'BlockInsecurePrivateNetworkRequests');
        app.commandLine.appendSwitch('ignore-certificate-errors');
        app.commandLine.appendSwitch('disable-background-timer-throttling');
        app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
        app.commandLine.appendSwitch('disable-renderer-backgrounding');
        
        // Set a user data directory to avoid cache permission issues
        app.setPath('userData', path.join(__dirname, 'userdata'));
        
        await app.whenReady();
        this.setupIpcHandlers();
        await this.createWindow();

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', async () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                await this.createWindow();
            }
        });
    }
}

// Initialize the application
const botyPro = new BotyProMain();
botyPro.initialize().catch(console.error);
