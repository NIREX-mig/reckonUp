// preload.js
// const { contextBridge, ipcRenderer } = require('electron');

// contextBridge.exposeInMainWorld('electron', {
//   increment: (count) => ipcRenderer.invoke('increment', count)
// });


const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => {
      func(...args);
    })
  },
  // remove: (channel) => {
  //   ipcRenderer.removeListener(channel)
  // },
  removeAll: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});