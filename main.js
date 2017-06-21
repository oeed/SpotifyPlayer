const electron = require('electron')
    // Module to control application life.
const app = electron.app
    // Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

const {
    session
} = require('electron')

app.commandLine.appendSwitch('widevine-cdm-path', 'widevinecdmadapter.plugin')
    // The version of plugin can be got from `chrome://plugins` page in Chrome.
app.commandLine.appendSwitch('widevine-cdm-version', '1.4.8.970')

function createWindow() {

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 340,
        height: 600,
        nodeIntegration: "iframe",
        webPreferences: {
            // The `plugins` have to be enabled.
            webSecurity: false,
            allowRunningInsecureContent: true,
            allowDisplayingInsecureContent: true,
            plugins: true
        }
    })

    // var webFrame = electron.webFrame;
    // webFrame.registerUrlSchemeAsBypassingCSP('file');
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: 'file:',
        slashes: true
    })); //'https://open.spotify.com/collection/albums')
    /*
        mainWindow.webContents.on('did-finish-load', () => {
            // Insert the Injektor

            function addScript(_path) {
                var scriptURL = url.format({
                    pathname: path.join(__dirname, _path),
                    protocol: 'file:',
                    slashes: true
                });
                mainWindow.webContents.executeJavaScript(`(function() {
                    var script = document.createElement('script');
                    script.setAttribute('src', '${scriptURL}');
                    script.setAttribute("type","text/javascript");
                    document.body.appendChild(script);
                })();        
                console.log('${_path}');`);
            }

            // 1. Enable the file protocol
            mainWindow.webContents.executeJavaScript('window.require("electron").webFrame.registerURLSchemeAsBypassingCSP("file");');

            // 2. Fix jQuery loading
            mainWindow.webContents.executeJavaScript("if (typeof module === 'object') {window.module = module; module = undefined;}");

            // 3. Load jQuery
            addScript('jquery.min.js');

            // 4. The Injektor
            addScript('injektor.js');

            // 5. 'Unfix' the jQuery loader
            mainWindow.webContents.executeJavaScript("if (window.module) module = window.module;");
        });*/

    mainWindow.inspectElement(1, 1);

    // mainWindow.webContents.session.clearStorageData([], function(data) {
    //     console.log(data);
    // })

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.