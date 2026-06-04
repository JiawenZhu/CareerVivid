import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('autoApplyRunner', {
  getStatus: () => ipcRenderer.invoke('runner:get-status'),
  openCareerVivid: () => ipcRenderer.invoke('runner:open-careervivid'),
  start: () => ipcRenderer.invoke('runner:start'),
  stop: () => ipcRenderer.invoke('runner:stop'),
});
