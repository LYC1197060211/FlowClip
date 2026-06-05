import { app, Menu, Tray } from 'electron'
import { APP_NAME } from '@shared/constants'
import { trayImage } from './icon'
import { setQuitting, showMainWindow, toggleMainWindow } from './windows/mainWindow'
import { togglePopup } from './windows/popupWindow'
import { toggleVoiceWindow } from './windows/voiceWindow'
import { getSettings, saveSettings, setTheme } from './store/settingsRepo'
import { applyAutoLaunch } from './autoLaunch'

let tray: Tray | null = null

export function createTray(): Tray {
  if (tray) return tray
  tray = new Tray(trayImage())
  tray.setToolTip(APP_NAME)
  rebuildTrayMenu()
  tray.on('click', () => toggleMainWindow())
  tray.on('double-click', () => showMainWindow())
  return tray
}

export function rebuildTrayMenu(): void {
  if (!tray) return
  const s = getSettings()
  const menu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => showMainWindow() },
    { label: '呼出快捷面板', click: () => togglePopup() },
    { label: '语音输入', click: () => toggleVoiceWindow() },
    { type: 'separator' },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: s.launchOnStartup,
      click: (item) => {
        saveSettings({ launchOnStartup: item.checked })
        applyAutoLaunch(item.checked)
      }
    },
    {
      label: '深色模式',
      type: 'checkbox',
      checked: s.theme === 'dark',
      click: (item) => {
        setTheme(item.checked ? 'dark' : 'light')
        rebuildTrayMenu()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        setQuitting(true)
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}
