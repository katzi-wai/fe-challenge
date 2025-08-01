import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getOrCreatePlayer: (playerName: string) => ipcRenderer.invoke('get-or-create-player', playerName),
  startGame: (playerId: number, startingBalance: number) =>
    ipcRenderer.invoke('start-game', playerId, startingBalance),
  endGame: (gameId: number, endingBalance: number) =>
    ipcRenderer.invoke('end-game', gameId, endingBalance),
  recordSpin: (gameId: number, symbols: string, betAmount: number, winAmount: number) =>
    ipcRenderer.invoke('record-spin', gameId, symbols, betAmount, winAmount),
  getLeaderboard: () => ipcRenderer.invoke('get-leaderboard')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
