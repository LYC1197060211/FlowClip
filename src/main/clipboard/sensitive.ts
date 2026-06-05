const KEY_VALUE_RE =
  /\b(password|passwd|pwd|token|secret|api[_-]?key|access[_-]?key|refresh[_-]?token|access[_-]?token|authorization|bearer)\b\s*[:=]\s*["']?[^\s"']{6,}/i

const URL_PARAM_RE =
  /[?&](password|passwd|pwd|token|secret|api[_-]?key|access[_-]?key|refresh[_-]?token|access[_-]?token)=([^&#\s]{6,})/i

const TOKEN_RE_LIST = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
]

export function isSensitiveClipboardText(text: string): boolean {
  const value = text.trim()
  if (!value) return false
  if (KEY_VALUE_RE.test(value)) return true
  if (URL_PARAM_RE.test(value)) return true
  return TOKEN_RE_LIST.some((pattern) => pattern.test(value))
}
