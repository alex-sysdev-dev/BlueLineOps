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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluelineopsok.vercel.app'
const PRIVACY_URL = `${SITE_URL}/privacy`

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildPrefilledLoginUrl(input: Pick<RequestAccessEmailInput, 'name' | 'email'>): string {
  const url = new URL('/login', SITE_URL)
  url.searchParams.set('mode', 'login')
  url.searchParams.set('name', input.name)
  url.searchParams.set('email', input.email)
  return url.toString()
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

export function buildRequestAccessConfirmationEmail(input: RequestAccessEmailInput) {
  const platformUrl = buildPrefilledLoginUrl(input)
  const subject = 'Your BlueLineOps access request is in review'
  const reason = input.requestReason || input.accessNeed
  const text = [
    `Thank you, ${input.name}.`,
    '',
    `We appreciate your interest in BlueLineOps. Your request for ${input.company} is in review. Once approved, you will receive view-only access to the command view, plus sign-in details and a short walkthrough.`,
    '',
    `Company: ${input.company}`,
    `Role: ${input.role}`,
    'Access level: View-only - In Review',
    `Need for: ${reason || 'Not provided'}`,
    '',
    `Explore platform: ${platformUrl}`,
  ].join('\n')

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Thank you for requesting access - BlueLineOps</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    html, body { margin:0 !important; padding:0 !important; height:100% !important; width:100% !important; }
    * { -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt !important; mso-table-rspace:0pt !important; border-collapse:collapse !important; }
    img { -ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
    a { text-decoration:none; }
    a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
    .em-link:hover { opacity:0.88 !important; }
    @media only screen and (max-width:600px){
      .em-container { width:100% !important; }
      .em-px { padding-left:24px !important; padding-right:24px !important; }
      .em-h1 { font-size:25px !important; line-height:31px !important; }
    }
    @media only screen and (max-width:460px){
      .em-cell { display:block !important; width:100% !important; padding:0 0 12px 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#04060c; color:#e8edf6;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#04060c; opacity:0;">
    Thank you for requesting access to BlueLineOps - your request is in review.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#04060c;">
    <tr>
      <td align="center" style="padding:36px 12px 52px 12px;">
        <table role="presentation" class="em-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
          <tr>
            <td class="em-px" style="padding:4px 6px 22px 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle; padding-right:10px;">
                          <div style="width:30px; height:30px; border-radius:50%; border:1px solid #2a3a52; background-color:#0a1424; text-align:center; line-height:30px; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#4a9eff; font-weight:bold;">&#10227;</div>
                        </td>
                        <td style="vertical-align:middle; font-family:Arial,Helvetica,sans-serif; font-size:18px; font-weight:bold; letter-spacing:-0.3px;">
                          <span style="color:#4a9eff;">Blue</span><span style="color:#ffffff;">LineOps</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle; font-family:Arial,Helvetica,sans-serif; font-size:9px; letter-spacing:1.5px; color:#5b6b82; text-transform:uppercase;">
                    Operational Intelligence
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a111e; background-image:linear-gradient(180deg, rgba(125,160,220,0.13) 0%, rgba(10,17,30,0) 32%); border:1px solid #1c2738; border-top:1px solid #36486a; border-radius:14px;">
                <tr>
                  <td class="em-px" style="padding:44px 46px 0 46px;">
                    <p style="margin:0 0 18px 0; font-family:Arial,Helvetica,sans-serif; font-size:10px; font-weight:bold; letter-spacing:2.5px; color:#34d399; text-transform:uppercase;">
                      Access Requested
                    </p>
                    <h1 class="em-h1" style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:29px; line-height:36px; font-weight:bold; color:#ffffff; letter-spacing:-0.5px;">
                      Thank you, ${escapeHtml(input.name)}.
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td class="em-px" style="padding:18px 46px 0 46px;">
                    <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:25px; color:#a7b2c2;">
                      We appreciate your interest in <span style="color:#e8edf6;">BlueLineOps</span>. Your request for ${escapeHtml(input.company)} is in review. Once approved, you&rsquo;ll receive <span style="color:#e8edf6;">view-only access</span> to the command view - full visibility into your operation, with no edit or configuration permissions - plus sign-in details and a short walkthrough.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td class="em-px" style="padding:30px 46px 0 46px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="em-cell" width="50%" valign="top" style="padding:0 7px 14px 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d1626; background-image:linear-gradient(180deg, rgba(140,175,230,0.10), rgba(0,0,0,0)); border:1px solid #1d2a3e; border-top:1px solid #2f415e; border-radius:10px;">
                            <tr><td style="padding:15px 17px;">
                              <p style="margin:0 0 5px 0; font-family:Arial,Helvetica,sans-serif; font-size:10px; letter-spacing:1.5px; color:#6b7889; text-transform:uppercase;">Company</p>
                              <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:15px; color:#ffffff; font-weight:bold;">${escapeHtml(input.company)}</p>
                            </td></tr>
                          </table>
                        </td>
                        <td class="em-cell" width="50%" valign="top" style="padding:0 0 14px 7px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d1626; background-image:linear-gradient(180deg, rgba(140,175,230,0.10), rgba(0,0,0,0)); border:1px solid #1d2a3e; border-top:1px solid #2f415e; border-radius:10px;">
                            <tr><td style="padding:15px 17px;">
                              <p style="margin:0 0 5px 0; font-family:Arial,Helvetica,sans-serif; font-size:10px; letter-spacing:1.5px; color:#6b7889; text-transform:uppercase;">Your role</p>
                              <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:15px; color:#e8edf6;">${escapeHtml(input.role)}</p>
                            </td></tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td class="em-cell" width="50%" valign="top" style="padding:0 7px 0 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d1626; background-image:linear-gradient(180deg, rgba(140,175,230,0.10), rgba(0,0,0,0)); border:1px solid #1d2a3e; border-top:1px solid #2f415e; border-radius:10px;">
                            <tr><td style="padding:15px 17px;">
                              <p style="margin:0 0 5px 0; font-family:Arial,Helvetica,sans-serif; font-size:10px; letter-spacing:1.5px; color:#6b7889; text-transform:uppercase;">Access level</p>
                              <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#34d399; font-weight:bold;">&#9679; View-only &middot; In Review</p>
                            </td></tr>
                          </table>
                        </td>
                        <td class="em-cell" width="50%" valign="top" style="padding:0 0 0 7px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d1626; background-image:linear-gradient(180deg, rgba(140,175,230,0.10), rgba(0,0,0,0)); border:1px solid #1d2a3e; border-top:1px solid #2f415e; border-radius:10px;">
                            <tr><td style="padding:15px 17px;">
                              <p style="margin:0 0 5px 0; font-family:Arial,Helvetica,sans-serif; font-size:10px; letter-spacing:1.5px; color:#6b7889; text-transform:uppercase;">Need for</p>
                              <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:20px; color:#c4cdda;">${escapeHtml(reason || 'Not provided')}</p>
                            </td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="em-px" style="padding:30px 46px 0 46px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${platformUrl}" style="height:48px;v-text-anchor:middle;width:210px;" arcsize="16%" stroke="f" fillcolor="#2563eb">
                    <w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;">EXPLORE PLATFORM</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <a class="em-link" href="${platformUrl}" style="display:inline-block; background-color:#2563eb; color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:bold; letter-spacing:1px; line-height:48px; text-align:center; text-decoration:none; padding:0 32px; border-radius:8px;">EXPLORE PLATFORM</a>
                    <!--<![endif]-->
                  </td>
                </tr>

                <tr>
                  <td class="em-px" style="padding:26px 46px 40px 46px;">
                    <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:24px; color:#a7b2c2;">
                      With appreciation,<br />
                      <span style="color:#e8edf6;">The BlueLineOps Team</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="em-px" style="padding:26px 8px 10px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:19px; color:#5f6c7e;">
                    Operational intelligence for logistics.<br />
                    BlueLineOps
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px; font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#5f6c7e;">
                    <a href="${SITE_URL}" style="color:#7c8aa0; text-decoration:none;">Website</a>
                    &nbsp;&middot;&nbsp;
                    <a href="mailto:support@bluelineops.com" style="color:#7c8aa0; text-decoration:none;">Support</a>
                    &nbsp;&middot;&nbsp;
                    <a href="${PRIVACY_URL}" style="color:#7c8aa0; text-decoration:none;">Privacy</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:13px; font-family:Arial,Helvetica,sans-serif; font-size:11px; line-height:17px; color:#454f5e;">
                    Didn&rsquo;t request this? Let us know at <a href="mailto:security@bluelineops.com" style="color:#6b7a90; text-decoration:none;">security@bluelineops.com</a>. &copy; 2026 BlueLineOps.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, text, html }
}
