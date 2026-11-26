// Narmac Societe for Windows: a window that opens the live app, and updates itself.
// The app itself (screens, figures, fixes) always comes from the website, so it is always the latest.
// This program only updates when the window itself changes; it does that quietly from GitHub Releases.
const { app, BrowserWindow, shell, session, Notification, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

const APP_URL = 'https://narmacsociete.netlify.app/';
const APP_ORIGIN = new URL(APP_URL).origin;
let win = null;

// only one copy open at a time: a second double-click brings the first window forward
if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.setAppUserModelId('com.narmacsociete.stockbook');

// remember the window size and place
const boundsFile = () => path.join(app.getPath('userData'), 'window.json');
const loadBounds = () => { try { return JSON.parse(fs.readFileSync(boundsFile(), 'utf8')); } catch (e) { return null; } };
const saveBounds = () => { try { if (win && !win.isMinimized()) fs.writeFileSync(boundsFile(), JSON.stringify({ ...win.getNormalBounds(), max: win.isMaximized() })); } catch (e) {} };

function createWindow() {
  const b = loadBounds() || { width: 1280, height: 820 };
  win = new BrowserWindow({
    x: b.x, y: b.y, width: b.width || 1280, height: b.height || 820, minWidth: 380, minHeight: 500,
    title: 'Narmac Societe', backgroundColor: '#12233f', autoHideMenuBar: true, show: false,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: true }
  });
  if (b.max) win.maximize();
  win.once('ready-to-show', () => win.show());
  ['resize', 'move', 'close'].forEach(ev => win.on(ev, saveBounds));

  // links to other sites (WhatsApp, email, maps...) open in the normal browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_ORIGIN) || url === 'about:blank') return { action: 'allow' };
    if (/^(https?:|mailto:|tel:|whatsapp:)/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(APP_ORIGIN)) { e.preventDefault(); if (/^(https?:|mailto:|tel:)/.test(url)) shell.openExternal(url); }
  });

  // no internet: show a small page with a Try again button
  win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => {
    if (isMain && code !== -3) win.loadFile(path.join(__dirname, 'offline.html'));
  });
  win.loadURL(APP_URL);
}

// camera (barcode scanner), microphone (voice notes), notifications and fullscreen: allowed for the app only
function permissions() {
  const ok = ['media', 'notifications', 'fullscreen', 'clipboard-sanitized-write', 'clipboard-read'];
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(wc.getURL().startsWith(APP_ORIGIN) && ok.includes(perm)));
  session.defaultSession.setPermissionCheckHandler((wc, perm, origin) => (origin || '').startsWith(APP_ORIGIN) && ok.includes(perm));
}

// self-update: check at start and every 6 hours; a downloaded update installs when the app is closed
function updates() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-downloaded', info => {
    try { new Notification({ title: 'Narmac Societe', body: `Update ${info.version} is ready. It installs the next time you close the app.` }).show(); } catch (e) {}
  });
  autoUpdater.on('error', () => {}); // no internet or GitHub unreachable: try again later
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  check(); setInterval(check, 6 * 60 * 60 * 1000);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'View', submenu: [{ role: 'reload', label: 'Reload' }, { role: 'togglefullscreen' }, { type: 'separator' },
      { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }] },
    { label: 'Help', submenu: [{ label: `Version ${app.getVersion()}`, enabled: false },
      { label: 'Check for updates', click: () => app.isPackaged && autoUpdater.checkForUpdates().catch(() => {}) }] }
  ]));
  permissions();
  createWindow();
  updates();
});
app.on('window-all-closed', () => app.quit());
