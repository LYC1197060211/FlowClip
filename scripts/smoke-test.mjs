import { createHash } from 'crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { dirname, extname, join } from 'path'
import { fileURLToPath } from 'url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = join(scriptDir, '..')
const failures = []

function relPath(path) {
  return path.replaceAll('\\', '/')
}

function readText(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function record(name, passed, detail = '') {
  if (passed) {
    console.log(`PASS ${name}`)
    return
  }
  failures.push(`${name}${detail ? `: ${detail}` : ''}`)
  console.error(`FAIL ${name}${detail ? ` - ${detail}` : ''}`)
}

function requireFile(relativePath, options = {}) {
  const absolutePath = join(root, relativePath)
  const name = relPath(relativePath)
  if (!existsSync(absolutePath)) {
    record(name, false, 'missing')
    return null
  }
  const stats = statSync(absolutePath)
  const minBytes = options.minBytes ?? 1
  record(name, stats.size >= minBytes, `expected at least ${minBytes} bytes, got ${stats.size}`)
  return stats
}

function requireIncludes(relativePath, needles) {
  const content = readText(relativePath)
  for (const needle of needles) {
    record(`${relPath(relativePath)} includes ${needle}`, content.includes(needle))
  }
}

function listSourceFiles(dir) {
  const absoluteDir = join(root, dir)
  return readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(relativePath)
    return [relativePath]
  })
}

function sha256(relativePath) {
  const hash = createHash('sha256')
  hash.update(readFileSync(join(root, relativePath)))
  return hash.digest('hex').toUpperCase()
}

const pkg = JSON.parse(readText('package.json'))
record('package name is flowclip', pkg.name === 'flowclip', `got ${pkg.name}`)
record('package version is 1.0.0', pkg.version === '1.0.0', `got ${pkg.version}`)

requireFile('build/icon.ico', { minBytes: 1024 })
requireFile('build/icon.png', { minBytes: 1024 })
requireFile('build/tray.png', { minBytes: 100 })
requireFile('output/pdf/FlowClip_User_Guide.pdf', { minBytes: 50_000 })
const installerStats = requireFile('release/FlowClip-Setup-1.0.0.exe', { minBytes: 50_000_000 })
requireFile('release/FlowClip-Setup-1.0.0.exe.sha256.txt', { minBytes: 64 })
requireFile('release/win-unpacked/resources/docs/FlowClip_User_Guide.pdf', { minBytes: 50_000 })
requireFile('release/win-unpacked/resources/docs/FlowClip-发布说明.md', { minBytes: 2_000 })
requireFile('docs/FlowClip-使用说明.md', { minBytes: 5_000 })
requireFile('docs/FlowClip-发布说明.md', { minBytes: 2_000 })

requireIncludes('src/renderer/components/voice/VoicePanel.tsx', [
  'window.api.clipboard.writeText',
  'compact && onClose',
  'onClose()'
])
requireIncludes('src/renderer/components/translate/TranslateView.tsx', [
  'window.api.clipboard.writeText'
])
requireIncludes('src/main/clipboard.ts', [
  'writeClipboardText',
  'clipboard.writeText(text)',
  'normalizeText(clipboard.readText())',
  'normalizeText(text)'
])
requireIncludes('src/main/clipboard/watcher.ts', [
  'sensitiveFilterEnabled',
  'isSensitiveClipboardText(text)'
])
requireIncludes('src/main/clipboard/sensitive.ts', [
  'isSensitiveClipboardText',
  'KEY_VALUE_RE',
  'URL_PARAM_RE',
  'TOKEN_RE_LIST'
])
requireIncludes('src/shared/constants.ts', [
  'TRANSLATION_PROVIDER_PRESETS',
  'ASR_PROVIDER_PRESETS',
  'SYSTEM_OPEN_USER_GUIDE',
  'SYSTEM_OPEN_RELEASE_NOTES',
  'SYSTEM_GET_SUPPORT_DIAGNOSTICS',
  'https://api.deepseek.com',
  'deepseek-v4-flash',
  'FunAudioLLM/SenseVoiceSmall'
])
requireIncludes('electron-builder.yml', [
  'extraResources:',
  'FlowClip_User_Guide.pdf',
  'FlowClip-发布说明.md'
])
requireIncludes('src/main/docs.ts', [
  'process.resourcesPath',
  'openBundledDoc',
  'shell.openPath(filePath)'
])
requireIncludes('src/main/support.ts', [
  'buildSupportDiagnostics',
  'API 配置摘要',
  '本报告不包含 API Key',
  'safeUrl',
  'proxyUrl ?'
])
requireIncludes('src/shared/types.ts', [
  'openUserGuide',
  'openReleaseNotes',
  'getSupportDiagnostics',
  'details?: string[]'
])
requireIncludes('src/main/diagnostics.ts', [
  'httpStatusHint',
  'proxyDetail',
  'responsePreview'
])
requireIncludes('src/main/translation/openai.ts', [
  "url.hostname === 'api.deepseek.com'",
  "base.endsWith('/v1')",
  '/chat/completions'
])
requireIncludes('src/main/translation/deepseek.ts', [
  'chatCompletionsUrl(cfg.apiBaseUrl)'
])
requireIncludes('src/main/translation/index.ts', [
  'INVALID_API_BASE_URL',
  'httpStatusHint',
  'proxyDetail'
])
requireIncludes('src/main/asr/index.ts', [
  'modelListDetail(models)',
  'responsePreview(res)',
  'chatCompletionsUrl(t.apiBaseUrl)'
])
requireIncludes('src/renderer/components/common/DiagnosticPanel.tsx', [
  '复制诊断',
  'window.api.clipboard.writeText(report)',
  'redactDiagnosticText',
  'role={ok ?',
  'aria-live="polite"'
])
requireIncludes('src/renderer/components/common/Dialog.tsx', [
  'role="dialog"',
  'aria-modal="true"',
  'aria-labelledby',
  "event.key === 'Escape'",
  'panelRef.current?.focus()'
])
requireIncludes('src/renderer/components/common/Button.tsx', [
  "type Variant = 'primary' | 'ghost' | 'danger'",
  "variant === 'danger'"
])
requireIncludes('src/renderer/components/common/Dropdown.tsx', [
  'aria-haspopup="listbox"',
  'aria-expanded={open}',
  'role="option"',
  'aria-selected={o.value === value}'
])
requireIncludes('src/renderer/components/settings/SettingsView.tsx', [
  '帮助与文档',
  'openUserGuide',
  'openReleaseNotes',
  'copySupportDiagnostics',
  'getSupportDiagnostics',
  'window.api.clipboard.writeText(text)',
  'aria-label="打开用户手册"',
  'aria-label="打开发布说明"',
  'aria-label="复制应用诊断信息"'
])
requireIncludes('src/renderer/components/clipboard/ClipboardView.tsx', [
  'setConfirmClear(true)',
  'variant="danger"',
  '清空全部记录',
  '置顶记录也会被删除'
])
requireIncludes('src/renderer/components/voice/AsrSettingsOverlay.tsx', [
  'DiagnosticPanel',
  'title="语音转写"',
  'ASR_PROVIDER_PRESETS',
  'applyPreset'
])
requireIncludes('src/renderer/components/translate/TranslateSettingsOverlay.tsx', [
  'DiagnosticPanel',
  'title="翻译"',
  'TRANSLATION_PROVIDER_PRESETS',
  'applyPreset'
])
requireIncludes('src/main/phrases/variables.ts', [
  'expandPhraseVariables',
  '{{clipboard}}',
  '{{date}}'
])
requireIncludes('src/main/store/phrasesRepo.ts', [
  'buildLibraryExport',
  'importLibrary',
  'expandPhraseVariables(p.content)'
])
requireIncludes('src/renderer/components/phrases/NewPhraseDialog.tsx', [
  'PHRASE_VARIABLES.map'
])
requireIncludes('src/renderer/components/clipboard/ClipboardItemCard.tsx', [
  'item.pinned',
  'onTogglePin'
])
requireIncludes('src/renderer/PopupApp.tsx', [
  'setQuery',
  'autoPasteOnPopup',
  'window.api.system.pasteClipboard()'
])
requireIncludes('src/main/shortcuts.ts', [
  'getShortcutFailures'
])

const sourceFiles = listSourceFiles('src').filter((file) => ['.ts', '.tsx'].includes(extname(file)))
const browserClipboardUsers = sourceFiles.filter((file) => readText(file).includes('navigator.clipboard'))
record(
  'renderer does not use navigator.clipboard',
  browserClipboardUsers.length === 0,
  browserClipboardUsers.map(relPath).join(', ')
)

if (installerStats) {
  const installerHash = sha256('release/FlowClip-Setup-1.0.0.exe')
  const shaFile = readText('release/FlowClip-Setup-1.0.0.exe.sha256.txt')
  const releaseNotes = readText('docs/FlowClip-发布说明.md')
  record('installer SHA256 sidecar matches', shaFile.includes(installerHash), installerHash)
  record('installer SHA256 sidecar names installer', shaFile.includes('FlowClip-Setup-1.0.0.exe'))
  record('release notes point to SHA256 sidecar', releaseNotes.includes('FlowClip-Setup-1.0.0.exe.sha256.txt'))
}

if (failures.length > 0) {
  console.error('\nSmoke test failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('\nSmoke test passed.')
