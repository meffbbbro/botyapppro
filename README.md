# 🚀 BotyPro Enhanced - Electron Edition

A modern, cross-platform Telegram automation tool built with Electron, featuring a stunning UI with gradients, animations, and intuitive controls.

## ✨ Features

- **🎨 Stunning Modern UI**: Beautiful gradients, animations, and responsive design
- **🔐 Secure Authentication**: Telegram API integration with session persistence
- **👥 Group Management**: Easy selection and management of target groups
- **💌 Message Templates**: Multiple customizable message templates
- **⚙️ Advanced Settings**: Configurable delays, cycles, and queue control
- **📜 Real-time Logging**: Live activity feed with color-coded status messages
- **💾 Auto-save Configuration**: Automatic saving of all settings
- **🚀 Progress Tracking**: Visual progress bars and queue management

## 🔧 Installation

### Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Telegram API Credentials** - [Get them here](https://my.telegram.org/apps)

### Quick Setup

1. **Navigate to the project directory:**

   ```bash
   cd botyproenhanged-electron
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   npm start
   ```

### Development Mode

To run with developer tools enabled:
```bash
npm run dev
```

### Building Executables

To create distributable packages:
```bash
npm run build
```

## 🎯 Getting Started

### 1. Obtain Telegram API Credentials

1. Visit [my.telegram.org](https://my.telegram.org/apps)
2. Log in with your Telegram account
3. Create a new application
4. Note down your `API ID` and `API Hash`

### 2. Configure the Application

1. Launch BotyPro Enhanced
2. Go to the **🔐 Login** tab
3. Enter your:
   - API ID
   - API Hash
   - Phone Number (with country code, e.g., +1234567890)
4. Click **🔗 Connect to Telegram**
5. Enter the verification code sent to your phone
6. If you have 2FA enabled, enter your password when prompted

### 3. Set Up Message Queue

1. Go to the **🚀 Queue** tab
2. Click **🔄 Refresh Groups** to load your Telegram groups
3. Select target groups by checking the boxes
4. Enter your message templates in the text areas
5. Configure delay and repeat cycles
6. Click **🚀 Start Queue** to begin sending

## 📋 Usage Guide

### Connection Tab
- **API Credentials**: Enter your Telegram API details
- **Session Persistence**: Your session is automatically saved for future use
- **One-click Connection**: Simple connection process with guided prompts

### Queue Tab
- **Group Selection**: Choose which groups to target
- **Message Templates**: Up to 3 customizable message templates
- **Queue Settings**: Configure delays between messages and repeat cycles
- **Progress Tracking**: Real-time progress bar and queue control

### Log Tab

- **Activity Monitor**: Live feed of all application activities
- **Color-coded Messages**: Success (green), errors (red), warnings (yellow)
- **Clear Function**: Easy log clearing for fresh starts

## 🛠️ Advanced Configuration

### Custom Delays
- Minimum: 1 second
- Maximum: 3600 seconds (1 hour)
- Recommended: 5-30 seconds to avoid rate limiting

### Repeat Cycles
- Send the same messages multiple times
- Useful for campaigns or recurring announcements
- Range: 1-100 cycles

### Session Management
- Sessions are automatically saved after successful connection
- Reuse saved sessions to avoid re-authentication
- Session strings are encrypted and stored locally

## 🔒 Security & Privacy

- **Local Storage**: All data is stored locally on your machine
- **No Cloud Dependencies**: No external servers or data collection
- **Encrypted Sessions**: Telegram sessions are properly encrypted
- **Safe API Usage**: Built-in rate limiting and error handling

## 🐛 Troubleshooting

### Connection Issues
- **Invalid Credentials**: Double-check your API ID and API Hash
- **Phone Number Format**: Use international format (+1234567890)
- **Network Issues**: Check your internet connection
- **2FA Problems**: Ensure your 2FA password is correct

### Queue Issues
- **No Groups Loaded**: Make sure you're connected to Telegram first
- **Messages Not Sending**: Check for network issues or group permissions
- **Rate Limiting**: Increase delay between messages if you get flood errors

### Common Errors
- **"Not connected"**: Click the connect button in the Login tab
- **"No groups selected"**: Check at least one group in the Queue tab
- **"No messages"**: Add at least one message template

## 📁 Project Structure

```
botyproenhanged-electron/
├── main.js          # Electron main process
├── renderer.js      # Application logic
├── index.html       # UI structure
├── style.css        # Styling and animations
├── package.json     # Dependencies and scripts
└── README.md        # This file
```

## 🔄 Updates & Maintenance

- **Automatic Config Saving**: Settings are saved automatically
- **Error Recovery**: Built-in error handling and recovery
- **Session Persistence**: No need to re-authenticate frequently
- **Clean Logging**: Clear logs to maintain performance

## 📞 Support

If you encounter any issues:

1. Check the **📜 Log** tab for error messages
2. Ensure you have the latest version of Node.js
3. Verify your Telegram API credentials
4. Check your internet connection
5. Review the troubleshooting section above

## ⚡ Performance Tips

- **Optimal Delays**: Use 5-10 second delays for best performance
- **Group Limits**: Select reasonable number of groups to avoid overwhelming
- **Message Length**: Keep messages concise for faster sending
- **Regular Clearing**: Clear logs periodically for better performance

---

**🎉 Enjoy using BotyPro Enhanced!** 

*Built with ❤️ using Electron, modern web technologies, and a passion for beautiful, functional software.*
