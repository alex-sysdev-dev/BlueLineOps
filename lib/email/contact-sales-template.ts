export type ContactSalesEmailInput = {
  name: string
  email: string
  company: string
  phone: string
  role: string
  useCase: string
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

function buildUseCaseAnswer(useCase: string): string {
  if (!useCase) {
    return ''
  }

  return [
    'BlueLineOps response:',
    'This use case should be reviewed against the live command view: warehouse performance, labor utilization, inventory accuracy, inbound execution, yard activity, and CPT risk. The next step is to map the stated problem to the operational signals needed for a practical pilot or sales conversation.',
  ].join(' ')
}

export function buildContactSalesEmail(input: ContactSalesEmailInput) {
  const useCaseAnswer = buildUseCaseAnswer(input.useCase)
  const subject = `BlueLineOps Contact Sales - ${input.company}`

  const textParts = [
    'New BlueLineOps contact sales request',
    '',
    `Name: ${input.name}`,
    `Company: ${input.company}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
    `Role: ${input.role}`,
    `Newsletter opt-in: ${input.newsletterOptIn ? 'Yes' : 'No'}`,
  ]

  if (input.useCase) {
    textParts.push('', 'Use case:', input.useCase, '', useCaseAnswer)
  }

  const useCaseHtml = input.useCase
    ? `
      <div style="margin-top:24px;padding:18px;border:1px solid #1f3b63;border-radius:14px;background:#07111f;">
        <p style="margin:0 0 8px;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Use Case</p>
        <p style="margin:0;color:#e5e7eb;line-height:1.65;">${escapeHtml(input.useCase).replaceAll('\n', '<br />')}</p>
      </div>
      <div style="margin-top:12px;padding:18px;border:1px solid #064e3b;border-radius:14px;background:#03150f;">
        <p style="margin:0 0 8px;color:#6ee7b7;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">BlueLineOps Response</p>
        <p style="margin:0;color:#d1fae5;line-height:1.65;">${escapeHtml(useCaseAnswer.replace('BlueLineOps response: ', ''))}</p>
      </div>
    `
    : ''

  const html = `
    <div style="margin:0;padding:0;background:#020617;color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
        <div style="border:1px solid #1e3a8a;border-radius:18px;background:#050a14;overflow:hidden;">
          <div style="padding:26px 28px;border-bottom:1px solid #172554;background:#071426;">
            <p style="margin:0;color:#60a5fa;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">BlueLineOps</p>
            <h1 style="margin:8px 0 0;color:#f8fafc;font-size:26px;line-height:1.2;">New contact sales request</h1>
          </div>
          <div style="padding:28px;">
            <table role="presentation" style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Name</td><td style="padding:10px 0;color:#f8fafc;">${escapeHtml(input.name)}</td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Company</td><td style="padding:10px 0;color:#f8fafc;">${escapeHtml(input.company)}</td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Email</td><td style="padding:10px 0;color:#f8fafc;">${escapeHtml(input.email)}</td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Phone</td><td style="padding:10px 0;color:#f8fafc;">${escapeHtml(input.phone)}</td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Role</td><td style="padding:10px 0;color:#f8fafc;">${escapeHtml(input.role)}</td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;font-weight:700;">Newsletter</td><td style="padding:10px 0;color:#f8fafc;">${input.newsletterOptIn ? 'Yes' : 'No'}</td></tr>
            </table>
            ${useCaseHtml}
          </div>
        </div>
      </div>
    </div>
  `

  return {
    subject,
    text: textParts.join('\n'),
    html,
  }
}
