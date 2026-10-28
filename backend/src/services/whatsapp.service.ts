import { Buffer } from 'buffer';

export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || '+14155238886';

  let cleanTo = to.replace(/[^0-9+]/g, '');
  if (!cleanTo.startsWith('+')) {
    if (cleanTo.length === 10) {
      cleanTo = `+91${cleanTo}`;
    } else {
      cleanTo = `+${cleanTo}`;
    }
  }

  const logHeader = `[WhatsApp API]`;

  if (!accountSid || !authToken) {
    console.log(`${logHeader} (SIMULATED) To ${cleanTo}: "${message}"`);
    return { success: true, error: 'Simulated (missing TWILIO config)' };
  }

  try {
    const authString = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams();
    params.append('To', `whatsapp:${cleanTo}`);
    params.append('From', `whatsapp:${from}`);
    params.append('Body', message);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.error(
        `${logHeader} Failed sending to ${cleanTo}:`,
        data.message || response.statusText
      );
      return { success: false, error: data.message || 'Twilio API error' };
    }

    console.log(`${logHeader} Message sent successfully to ${cleanTo}. SID: ${data.sid}`);
    return { success: true, messageId: data.sid };
  } catch (error: any) {
    console.error(`${logHeader} Error sending to ${cleanTo}:`, error);
    return { success: false, error: error.message || 'Exception during fetch' };
  }
}
