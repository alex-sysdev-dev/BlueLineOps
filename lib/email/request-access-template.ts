export type RequestAccessEmailInput = {
  name: string
  email: string
  company: string
  role: string
  accessNeed: string
  teamSize: string
  requestReason: string
  newsletterOptIn: boolean
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function buildRequestAccessEmail(input: RequestAccessEmailInput) {
  const subject = `BlueLineOps Request Access - ${input.company}`
  const text = [
    'New BlueLineOps request access submission',
    '',
    `Name: ${input.name}`,
    `Company: ${input.company}`,
    `Email: ${input.email}`,
    `Role: ${input.role}`,
    `Access need: ${input.accessNeed}`,
    `Team size: ${input.teamSize || 'Not provided'}`,
    `Newsletter opt-in: ${input.newsletterOptIn ? 'Yes' : 'No'}`,
    '',
    'Request reason:',
    input.requestReason || 'Not provided',
  ].join('\n')

  const html = `
    <div style="margin:0;padding:0;background:#020617;color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
        <div style="border:1px solid #064e3b;border-radius:18px;background:#04110c;overflow:hidden;">
          <div style="padding:26px 28px;border-bottom:1px solid #065f46;background:#052016;">
            <p style="margin:0;color:#6ee7b7;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">BlueLineOps</p>
            <h1 style="margin:8px 0 0;color:#f8fafc;font-size:26px;line-height:1.2;">New request access submission</h1>
          </div>
          <div style="padding:28px;">
            <table role="presentation" style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Name</td><td style="padding:10px 0;color:#f8fafc;">${escapeHtml(input.name)}</td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Company</td><td style="padding:10px 0;color:#f8fafc;">${escapeHtml(input.company)}</td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Email</td><td style="padding:10px 0;color:#f8fafc;">${escapeHtml(input.email)}</td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Role</td><td style="padding:10px 0;color:#f8fafc;">${escapeHtml(input.role)}</td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Access Need</td><td style="padding:10px 0;color:#f8fafc;">${escapeHtml(input.accessNeed)}</td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Team Size</td><td style="padding:10px 0;color:#f8fafc;">${escapeHtml(input.teamSize || 'Not provided')}</td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Newsletter</td><td style="padding:10px 0;color:#f8fafc;">${input.newsletterOptIn ? 'Yes' : 'No'}</td></tr>
            </table>
            ${
              input.requestReason
                ? `<div style="margin-top:24px;padding:18px;border:1px solid #064e3b;border-radius:14px;background:#03150f;"><p style="margin:0 0 8px;color:#6ee7b7;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Request Reason</p><p style="margin:0;color:#d1fae5;line-height:1.65;">${escapeHtml(input.requestReason).replaceAll('\n', '<br />')}</p></div>`
                : ''
            }
          </div>
        </div>
      </div>
    </div>
  `

  return { subject, text, html }
}
