import { clipboard } from 'electron'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function expandPhraseVariables(content: string): string {
  const now = new Date()
  const clipboardText = content.includes('{{clipboard}}') ? clipboard.readText() : ''
  return content
    .replaceAll('{{date}}', formatDate(now))
    .replaceAll('{{time}}', formatTime(now))
    .replaceAll('{{datetime}}', `${formatDate(now)} ${formatTime(now)}`)
    .replaceAll('{{weekday}}', WEEKDAYS[now.getDay()])
    .replaceAll('{{clipboard}}', clipboardText)
}
