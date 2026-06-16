import prisma from '@/lib/prisma';

export async function getWhatsAppSettings() {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          'WHATSAPP_ENABLED',
          'WHATSAPP_PHONE_ID',
          'WHATSAPP_ACCESS_TOKEN',
          'WHATSAPP_TEMPLATE_NEW_COURSE',
          'WHATSAPP_TEMPLATE_CERTIFICATE',
          'WHATSAPP_TEMPLATE_SUBSCRIPTION',
          'WHATSAPP_TEMPLATE_PROGRESS',
          'WHATSAPP_TEMPLATE_RESUME',
          'WHATSAPP_TEMPLATE_REFERRAL',
          'WHATSAPP_TEMPLATE_DISCOUNT'
        ]
      }
    }
  });

  const config = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    enabled: config['WHATSAPP_ENABLED'] === 'true',
    phoneId: config['WHATSAPP_PHONE_ID'] || '',
    accessToken: config['WHATSAPP_ACCESS_TOKEN'] || '',
    templates: {
      newCourse: config['WHATSAPP_TEMPLATE_NEW_COURSE'] || '',
      certificate: config['WHATSAPP_TEMPLATE_CERTIFICATE'] || '',
      subscription: config['WHATSAPP_TEMPLATE_SUBSCRIPTION'] || '',
      progress: config['WHATSAPP_TEMPLATE_PROGRESS'] || '',
      resume: config['WHATSAPP_TEMPLATE_RESUME'] || '',
      referral: config['WHATSAPP_TEMPLATE_REFERRAL'] || '',
      discount: config['WHATSAPP_TEMPLATE_DISCOUNT'] || ''
    }
  };
}

export async function sendWhatsAppMessage(to: string, templateName: string, languageCode: string = 'en_US', parameters: any[] = []) {
  const settings = await getWhatsAppSettings();
  
  if (!settings.enabled) {
    console.log('[WhatsApp] Integration disabled. Skipping message to:', to);
    return false;
  }
  
  if (!settings.phoneId || !settings.accessToken) {
    console.error('[WhatsApp] Missing credentials');
    return false;
  }

  if (!templateName) {
    console.error('[WhatsApp] Missing template name');
    return false;
  }

  // Format the phone number (remove +, spaces, dashes)
  const cleanPhone = to.replace(/[\+\s\-]/g, '');

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${settings.phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: parameters.length > 0 ? [
            {
              type: "body",
              parameters: parameters
            }
          ] : []
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[WhatsApp API Error]', data);
      return false;
    }
    
    console.log(`[WhatsApp] Successfully sent ${templateName} to ${cleanPhone}`);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Fetch Error:', error);
    return false;
  }
}
