import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, BrowserContext } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAREERVIVID_APP_URL = 'https://careervivid.app/';

let mainWindow: BrowserWindow | null = null;
let browserContext: BrowserContext | null = null;
let runnerState: 'idle' | 'running' | 'stopped' | 'error' = 'idle';
let lastError = '';

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 860,
    minHeight: 620,
    title: 'CareerVivid Apply Agent',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

async function ensurePlaywrightContext(): Promise<BrowserContext> {
  if (browserContext) return browserContext;

  const userDataDir = path.join(app.getPath('userData'), 'playwright-profile');
  browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
  });
  return browserContext;
}

async function openCareerVivid(): Promise<void> {
  const context = await ensurePlaywrightContext();
  const page = context.pages()[0] || await context.newPage();
  await page.goto(CAREERVIVID_APP_URL, { waitUntil: 'domcontentloaded' });
}

async function stopRunner(): Promise<void> {
  runnerState = 'stopped';
  if (browserContext) {
    await browserContext.close();
    browserContext = null;
  }
}

ipcMain.handle('runner:get-status', () => ({
  state: runnerState,
  lastError,
  appUrl: CAREERVIVID_APP_URL,
}));

ipcMain.handle('runner:open-careervivid', async () => {
  try {
    await openCareerVivid();
    return { success: true };
  } catch (error) {
    lastError = error instanceof Error ? error.message : 'Unable to open CareerVivid';
    runnerState = 'error';
    return { success: false, error: lastError };
  }
});

ipcMain.handle('runner:start', async () => {
  try {
    runnerState = 'running';
    lastError = '';
    await openCareerVivid();
    return { success: true };
  } catch (error) {
    lastError = error instanceof Error ? error.message : 'Unable to start runner';
    runnerState = 'error';
    return { success: false, error: lastError };
  }
});

ipcMain.handle('runner:stop', async () => {
  await stopRunner();
  return { success: true };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    void stopRunner().finally(() => app.quit());
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
