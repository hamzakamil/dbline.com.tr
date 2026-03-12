const crypto = require('crypto');
const Settings = require('../models/Settings');

class PaymentService {
  static async getConfig() {
    const settings = await Settings.findOne();
    return settings?.paymentConfig || { provider: 'iyzico', testMode: true };
  }

  /**
   * Ödeme başlat - aktif sağlayıcıya göre yönlendirir
   */
  static async createPayment(order, cardData, buyerData) {
    const config = await this.getConfig();

    switch (config.provider) {
      case 'iyzico':
        return this.createIyzicoPayment(config, order, cardData, buyerData);
      case 'paytr':
        return this.createPayTRPayment(config, order, cardData, buyerData);
      case 'paynkolay':
        return this.createPaynkolayPayment(config, order, cardData, buyerData);
      default:
        throw new Error('Desteklenmeyen ödeme sağlayıcısı');
    }
  }

  // ============ IYZICO ============
  static async createIyzicoPayment(config, order, cardData, buyerData) {
    const Iyzipay = require('iyzipay');
    const iyzipay = new Iyzipay({
      apiKey: config.iyzico.apiKey || process.env.IYZIPAY_API_KEY,
      secretKey: config.iyzico.secretKey || process.env.IYZIPAY_SECRET_KEY,
      uri: config.iyzico.baseUrl || process.env.IYZIPAY_BASE_URL || 'https://sandbox-api.iyzipay.com'
    });

    const request = {
      locale: 'tr',
      conversationId: order._id.toString(),
      price: order.totalAmount.toFixed(2),
      paidPrice: order.totalAmount.toFixed(2),
      currency: Iyzipay.CURRENCY.TRY,
      installment: '1',
      basketId: order._id.toString(),
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: {
        cardHolderName: cardData.cardHolderName,
        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
        expireMonth: cardData.expireMonth,
        expireYear: cardData.expireYear,
        cvc: cardData.cvc,
        registerCard: '0'
      },
      buyer: {
        id: buyerData.userId,
        name: buyerData.name.split(' ')[0] || 'Müşteri',
        surname: buyerData.name.split(' ').slice(1).join(' ') || 'Müşteri',
        gsmNumber: buyerData.phone || '+905000000000',
        email: buyerData.email || 'musteri@dbline.com.tr',
        identityNumber: '11111111111',
        registrationAddress: buyerData.address || 'Adres bilgisi yok',
        ip: buyerData.ip || '127.0.0.1',
        city: buyerData.city || 'Istanbul',
        country: 'Turkey',
        zipCode: buyerData.zipCode || '34000'
      },
      shippingAddress: {
        contactName: buyerData.name,
        city: buyerData.city || 'Istanbul',
        country: 'Turkey',
        address: buyerData.address || 'Adres bilgisi yok',
        zipCode: buyerData.zipCode || '34000'
      },
      billingAddress: {
        contactName: buyerData.name,
        city: buyerData.city || 'Istanbul',
        country: 'Turkey',
        address: buyerData.address || 'Adres bilgisi yok',
        zipCode: buyerData.zipCode || '34000'
      },
      basketItems: order.items.map((item, idx) => ({
        id: item.product.toString(),
        name: item.name || `Ürün ${idx + 1}`,
        category1: 'Giyim',
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: (item.price * item.quantity).toFixed(2)
      }))
    };

    // Kargo ücreti varsa sepete ekle
    if (order.shippingCost > 0) {
      request.basketItems.push({
        id: 'SHIPPING',
        name: 'Kargo',
        category1: 'Hizmet',
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price: order.shippingCost.toFixed(2)
      });
    }

    // İndirim varsa düzelt (sepet toplamı = paidPrice olmalı)
    if (order.discountAmount > 0) {
      // Sepet tutarını paidPrice'a eşitle
      const basketTotal = request.basketItems.reduce((s, i) => s + parseFloat(i.price), 0);
      const diff = basketTotal - order.totalAmount;
      if (diff > 0 && request.basketItems.length > 0) {
        const firstItem = request.basketItems[0];
        firstItem.price = (parseFloat(firstItem.price) - diff).toFixed(2);
      }
    }

    return new Promise((resolve, reject) => {
      iyzipay.payment.create(request, (err, result) => {
        if (err) return reject(new Error(err.errorMessage || 'Iyzico ödeme hatası'));
        if (result.status === 'success') {
          resolve({
            success: true,
            paymentId: result.paymentId,
            provider: 'iyzico',
            status: 'paid'
          });
        } else {
          resolve({
            success: false,
            message: result.errorMessage || 'Ödeme başarısız',
            provider: 'iyzico'
          });
        }
      });
    });
  }

  // ============ PAYTR ============
  static async createPayTRPayment(config, order, cardData, buyerData) {
    const merchantId = config.paytr.merchantId;
    const merchantKey = config.paytr.merchantKey;
    const merchantSalt = config.paytr.merchantSalt;

    if (!merchantId || !merchantKey || !merchantSalt) {
      throw new Error('PayTR yapılandırması eksik');
    }

    // PayTR iframe token oluştur
    const userIp = buyerData.ip || '127.0.0.1';
    const merchantOid = order._id.toString();
    const email = buyerData.email || 'musteri@dbline.com.tr';
    const paymentAmount = Math.round(order.totalAmount * 100); // Kuruş cinsinden
    const userBasket = Buffer.from(JSON.stringify(
      order.items.map(item => [item.name || 'Ürün', (item.price * 100).toFixed(0), item.quantity])
    )).toString('base64');

    const noInstallment = '1';
    const maxInstallment = '1';
    const currency = 'TL';
    const testMode = config.testMode ? '1' : '0';

    const hashStr = `${merchantId}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}`;
    const paytrToken = crypto.createHmac('sha256', merchantKey).update(hashStr + merchantSalt).digest('base64');

    // PayTR API'ye token isteği gönder
    const fetch = (await import('node-fetch')).default;
    const params = new URLSearchParams({
      merchant_id: merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email: email,
      payment_amount: paymentAmount.toString(),
      paytr_token: paytrToken,
      user_basket: userBasket,
      debug_on: testMode,
      no_installment: noInstallment,
      max_installment: maxInstallment,
      user_name: buyerData.name || 'Müşteri',
      user_address: buyerData.address || 'Adres',
      user_phone: buyerData.phone || '05000000000',
      merchant_ok_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success?orderId=${merchantOid}`,
      merchant_fail_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?error=payment_failed`,
      currency: currency,
      test_mode: testMode,
      cc_owner: cardData.cardHolderName,
      card_number: cardData.cardNumber.replace(/\s/g, ''),
      expiry_month: cardData.expireMonth,
      expiry_year: cardData.expireYear,
      cvv: cardData.cvc
    });

    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      body: params
    });
    const result = await response.json();

    if (result.status === 'success') {
      return {
        success: true,
        paymentId: result.token || merchantOid,
        provider: 'paytr',
        status: 'paid',
        token: result.token
      };
    } else {
      return {
        success: false,
        message: result.reason || 'PayTR ödeme hatası',
        provider: 'paytr'
      };
    }
  }

  // ============ PAYNKOLAY ============
  static async createPaynkolayPayment(config, order, cardData, buyerData) {
    const apiKey = config.paynkolay.apiKey;
    const secretKey = config.paynkolay.secretKey;
    const merchantId = config.paynkolay.merchantId;

    if (!apiKey || !secretKey) {
      throw new Error('Paynkolay yapılandırması eksik');
    }

    const fetch = (await import('node-fetch')).default;

    const paymentData = {
      merchant_id: merchantId,
      order_id: order._id.toString(),
      amount: Math.round(order.totalAmount * 100),
      currency: 'TRY',
      card_holder_name: cardData.cardHolderName,
      card_number: cardData.cardNumber.replace(/\s/g, ''),
      expire_month: cardData.expireMonth,
      expire_year: cardData.expireYear,
      cvc: cardData.cvc,
      installment: 1,
      buyer_name: buyerData.name || 'Müşteri',
      buyer_email: buyerData.email || 'musteri@dbline.com.tr',
      buyer_phone: buyerData.phone || '05000000000',
      buyer_ip: buyerData.ip || '127.0.0.1'
    };

    // HMAC imza oluştur
    const signStr = `${merchantId}${order._id}${paymentData.amount}`;
    const signature = crypto.createHmac('sha256', secretKey).update(signStr).digest('hex');
    paymentData.signature = signature;

    const baseUrl = config.testMode
      ? 'https://sandbox-api.paynkolay.com'
      : 'https://api.paynkolay.com';

    try {
      const response = await fetch(`${baseUrl}/v1/payment/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(paymentData)
      });
      const result = await response.json();

      if (result.status === 'success' || result.result_code === '00') {
        return {
          success: true,
          paymentId: result.transaction_id || result.payment_id || order._id.toString(),
          provider: 'paynkolay',
          status: 'paid'
        };
      } else {
        return {
          success: false,
          message: result.message || result.error_message || 'Paynkolay ödeme hatası',
          provider: 'paynkolay'
        };
      }
    } catch (err) {
      return {
        success: false,
        message: 'Paynkolay bağlantı hatası: ' + err.message,
        provider: 'paynkolay'
      };
    }
  }
}

module.exports = PaymentService;
