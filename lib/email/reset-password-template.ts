import 'server-only'

import { readFileSync } from 'fs'
import { join } from 'path'

const TEMPLATE_PATH = join(
  process.cwd(),
  'emailTemplates',
  'BlueLineOps Reset Password Email.supabase.html'
)

let cachedTemplate: string | null = null

function getTemplate(): string {
  cachedTemplate ??= readFileSync(TEMPLATE_PATH, 'utf8')
  return cachedTemplate
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function buildResetPasswordEmail(resetUrl: string) {
  const htmlSafeResetUrl = escapeHtml(resetUrl)
  const html = getTemplate().replaceAll('{{ .ConfirmationURL }}', htmlSafeResetUrl)
  const subject = 'Reset your BlueLineOps password'
  const text = [
    'Reset your BlueLineOps password',
    '',
    'We received a request to reset the password for your BlueLineOps account.',
    'Open this secure link to choose a new password:',
    resetUrl,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n')

  return { subject, text, html }
}
