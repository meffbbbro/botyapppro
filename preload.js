const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    loadConfig: () => ipcRenderer.invoke('load-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    connectTelegram: (credentials) => ipcRenderer.invoke('connect-telegram', credentials),
    getGroups: () => ipcRenderer.invoke('get-groups'),
    sendMessages: (params) => ipcRenderer.invoke('send-messages', params),
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
    showInputDialog: (options) => ipcRenderer.invoke('show-input-dialog', options),
    
    // Event listeners for main process communications
    onRequestInput: (callback) => ipcRenderer.on('request-input', callback),
    sendInputResponse: (channel, response) => ipcRenderer.send(channel, response),
    onQueueProgress: (callback) => ipcRenderer.on('queue-progress', callback),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
