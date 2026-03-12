const Settings = require('../models/Settings');

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '90' + cleaned.slice(1);
  if (!cleaned.startsWith('90')) cleaned = '90' + cleaned;
  return '+' + cleaned;
}

async function getWhatsAppConfig() {
  const settings = await Settings.findOne();
  if (!settings || !settings.whatsapp || !settings.whatsapp.enabled) {
    return null;
  }
  return settings.whatsapp;
}

async function sendMessage(phone, message) {
  const config = await getWhatsAppConfig();
  if (!config) {
    console.log('[WhatsApp] Servis aktif değil. Mesaj gönderilmedi:', phone);
    return { success: false, reason: 'whatsapp_disabled' };
  }

  const formattedPhone = formatPhoneNumber(phone);

  if (config.provider === 'twilio') {
    try {
      const twilio = require('twilio');
      const client = twilio(config.accountSid, config.authToken);
      const result = await client.messages.create({
        body: message,
        from: `whatsapp:${config.phoneNumber}`,
        to: `whatsapp:${formattedPhone}`
      });
      return { success: true, sid: result.sid };
    } catch (error) {
      console.error('[WhatsApp Twilio] Gönderim hatası:', error.message);
      return { success: false, reason: error.message };
    }
  }

  console.log(`[WhatsApp] Simülasyon - Mesaj gönderildi: ${formattedPhone}`);
  console.log(`[WhatsApp] İçerik: ${message}`);
  return { success: true, simulated: true };
}

async function sendWelcomeMessage(phone, name, couponCode, discountPercent, expiryDate) {
  const settings = await Settings.findOne();
  let template = settings?.marketingPopup?.whatsappMessageTemplate
    || 'Merhaba {name}! DB Line\'a hoşgeldiniz. İndirim kodunuz: {code}. Geçerlilik: {expiry}. Alışverişe başla: https://dbline.com.tr';

  const message = template
    .replace('{name}', name)
    .replace('{code}', couponCode)
    .replace('{discount}', discountPercent)
    .replace('{expiry}', expiryDate);

  return sendMessage(phone, message);
}

async function sendOrderUpdate(phone, orderDetails) {
  const message = `DB Line Sipariş Güncelleme: Sipariş #${orderDetails.orderNumber} durumu: ${orderDetails.status}. Detaylar: https://dbline.com.tr/my-orders`;
  return sendMessage(phone, message);
}

module.exports = {
  formatPhoneNumber,
  sendMessage,
  sendWelcomeMessage,
  sendOrderUpdate
};
