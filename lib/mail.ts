type SendMailInput = {
  to: string
  subject: string
  html: string
  text: string
}

function getMailConfig() {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim()
  const from = String(process.env.AUTH_FROM_EMAIL || '').trim()

  if (!apiKey || !from) {
    return null
  }

  return { apiKey, from }
}

export async function sendTransactionalEmail(input: SendMailInput) {
  const mailConfig = getMailConfig()

  if (!mailConfig) {
    const fallbackMessage = `Mail delivery is not configured. Intended email to ${input.to}: ${input.subject}`

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email delivery is not configured for production.')
    }

    console.warn(fallbackMessage)
    console.warn(input.text)
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mailConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: mailConfig.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Email delivery failed: ${errorText}`)
  }
}
