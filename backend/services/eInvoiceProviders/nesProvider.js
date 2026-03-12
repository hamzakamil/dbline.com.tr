// NES Bilgi E-Fatura Provider (REST API)
// Docs: https://developertest.nes.com.tr

let tokenCache = { token: null, expiresAt: null };

class NesProvider {

  static getBaseUrl(config) {
    return config.testMode
      ? (config.nes.testBaseUrl || 'https://apitest.nes.com.tr')
      : (config.nes.prodBaseUrl || 'https://api.nes.com.tr');
  }

  static async getToken(config) {
    if (tokenCache.token && tokenCache.expiresAt > Date.now()) {
      return tokenCache.token;
    }

    const fetch = (await import('node-fetch')).default;
    const baseUrl = this.getBaseUrl(config);

    const response = await fetch(`${baseUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: config.nes.username,
        password: config.nes.password
      })
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error(`NES login hatası: ${response.status} ${err}`);
    }

    const data = await response.json();
    tokenCache = {
      token: data.token || data.access_token || data.result,
      expiresAt: Date.now() + (55 * 60 * 1000)
    };
    return tokenCache.token;
  }

  static async apiRequest(config, method, path, body = null) {
    const fetch = (await import('node-fetch')).default;
    const token = await this.getToken(config);
    const baseUrl = this.getBaseUrl(config);

    const url = `${baseUrl}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
      if (response.status === 401) {
        tokenCache = { token: null, expiresAt: null };
        const newToken = await this.getToken(config);
        options.headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, options);
        if (!retryResponse.ok) {
          const errData = await retryResponse.json().catch(() => ({}));
          throw new Error(errData.message || `NES API hatası: ${retryResponse.status}`);
        }
        return retryResponse;
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `NES API hatası: ${response.status}`);
    }

    return response;
  }

  static async createInvoice(config, invoice, ettn) {
    // NES tek adımlı fatura gönderimi
    const items = invoice.items.map(item => ({
      malHizmet: item.name,
      miktar: item.quantity,
      birimFiyat: item.unitPrice,
      kdvOrani: item.taxRate || 20,
      tutar: item.totalPrice
    }));

    const body = {
      ettn,
      faturaTipi: config.defaultInvoiceType || 'SATIS',
      faturaProfili: config.defaultInvoiceProfile || 'EARSIVFATURA',
      faturaTarihi: new Date().toISOString().split('T')[0],
      faturaNo: invoice.invoiceNumber,
      // Gönderen bilgileri (firma)
      gonderenVkn: invoice.companyInfo.taxId,
      gonderenUnvan: invoice.companyInfo.name,
      gonderenVergiDairesi: invoice.companyInfo.taxOffice,
      // Alıcı bilgileri
      aliciVknTckn: invoice.customerInfo.taxId || '',
      aliciUnvan: invoice.customerInfo.name,
      aliciVergiDairesi: invoice.customerInfo.taxOffice || '',
      aliciAdres: invoice.customerInfo.address || '',
      aliciEposta: invoice.customerInfo.email || '',
      aliciTelefon: invoice.customerInfo.phone || '',
      // Kalemler
      kalemler: items,
      // Toplamlar
      araToplam: invoice.subtotal,
      kdvToplam: invoice.taxAmount,
      genelToplam: invoice.totalAmount,
      paraBirimi: 'TRY'
    };

    const response = await this.apiRequest(config, 'POST', '/fatura/olustur', body);
    const data = await response.json();

    return {
      transactionId: data.ettn || data.id || ettn,
      status: 'pending',
      rawResponse: data
    };
  }

  // NES tek adımlı akış - formalize ayrı bir adım değil
  static formalizeInvoice = null;

  static async getInvoiceStatus(config, transactionId) {
    const response = await this.apiRequest(config, 'GET',
      `/fatura/durum/${transactionId}`);
    const data = await response.json();

    const statusMap = {
      'BASARILI': 'completed',
      'BEKLEMEDE': 'pending',
      'ISLENIYOR': 'in_progress',
      'HATA': 'error',
      'IPTAL': 'cancelled',
      'COMPLETED': 'completed',
      'PENDING': 'pending',
      'IN_PROGRESS': 'in_progress',
      'ERROR': 'error',
      'CANCELLED': 'cancelled'
    };

    const status = data.durum || data.status || 'pending';
    return {
      status: statusMap[status.toUpperCase()] || 'pending',
      errorMessage: data.hataMesaji || data.errorMessage || null,
      rawResponse: data
    };
  }

  static async getPdf(config, transactionId) {
    const fetch = (await import('node-fetch')).default;
    const token = await this.getToken(config);
    const baseUrl = this.getBaseUrl(config);

    const response = await fetch(`${baseUrl}/fatura/pdf/${transactionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('NES PDF alınamadı');

    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      buffer,
      contentType: 'application/pdf',
      filename: `e-fatura-nes-${transactionId}.pdf`
    };
  }

  static async cancelInvoice(config, transactionId) {
    const response = await this.apiRequest(config, 'POST',
      `/fatura/iptal/${transactionId}`);
    const data = await response.json();
    return { rawResponse: data };
  }

  static async testConnection(config) {
    await this.getToken(config);
    return { success: true, message: 'NES Bilgi bağlantısı başarılı' };
  }
}

module.exports = NesProvider;
