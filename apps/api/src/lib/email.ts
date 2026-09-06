export async function sendMagicLinkEmail(apiKey: string, to: string, verifyUrl: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Parsi Games <login@parsigames.org>',
      to: [to],
      subject: 'ورود به پارسی گیمز / Sign in to Parsi Games',
      html: `
        <p dir="rtl">برای ورود به پارسی گیمز روی لینک زیر کلیک کنید (اعتبار: ۱۵ دقیقه):</p>
        <p dir="rtl"><a href="${verifyUrl}">${verifyUrl}</a></p>
        <hr />
        <p>Click the link below to sign in to Parsi Games (valid for 15 minutes):</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.status} ${await response.text()}`);
  }
}
