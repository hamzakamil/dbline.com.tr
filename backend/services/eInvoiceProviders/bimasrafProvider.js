// Bimasraf E-Fatura Provider (REST API)
// Docs: https://testapi.bimasraf.com/integrationdocs.html

let tokenCache = { token: null, expiresAt: null, tenantId: null };

class BimasrafProvider {

  static getBaseUrl(config) {
    return config.testMode
      ? (config.bimasraf.testBaseUrl || 'https://testapi.bimasraf.com')
      : (config.bimasraf.prodBaseUrl || 'https://api.bimasraf.com');
  }

  static async getToken(config) {
    if (tokenCache.token && tokenCache.expiresAt > Date.now() &&
        tokenCache.tenantId === config.bimasraf.tenantId) {
      return tokenCache.token;
    }

    const fetch = (await import('node-fetch')).default;
    const baseUrl = this.getBaseUrl(config);
    const tenantId = config.bimasraf.tenantId;

    const response = await fetch(`${baseUrl}/tenant/${tenantId}/integrations/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: config.bimasraf.username,
        password: config.bimasraf.password
      })
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error(`Bimasraf login hatası: ${response.status} ${err}`);
    }

    const data = await response.json();
    tokenCache = {
      token: data.token || data.accessToken || data.result,
      expiresAt: Date.now() + (55 * 60 * 1000),
      tenantId
    };
    return tokenCache.token;
  }

  static async apiRequest(config, method, path, body = null) {
    const fetch = (await import('node-fetch')).default;
    const token = await this.getToken(config);
    const baseUrl = this.getBaseUrl(config);
    const tenantId = config.bimasraf.tenantId;

    const url = `${baseUrl}/tenant/${tenantId}${path}`;
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
      // Token expired, retry once
      if (response.status === 401) {
        tokenCache = { token: null, expiresAt: null, tenantId: null };
        const newToken = await this.getToken(config);
        options.headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, options);
        if (!retryResponse.ok) {
          const errData = await retryResponse.json().catch(() => ({}));
          throw new Error(errData.message || `Bimasraf API hatası: ${retryResponse.status}`);
        }
        return retryResponse;
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Bimasraf API hatası: ${response.status}`);
    }

    return response;
  }

  // Müşteri kaydı oluştur/bul
  static async ensureAccountingParty(config, customerInfo) {
    // Önce mevcut müşteriyi ara
    try {
      const searchRes = await this.apiRequest(config, 'GET',
        `/integrations/accountingparties?q=${encodeURIComponent(customerInfo.name)}&size=1`);
      const searchData = await searchRes.json();
      if (searchData.data && searchData.data.length > 0) {
        return searchData.data[0].id;
      }
    } catch (e) {
      // Arama başarısız olursa yeni oluştur
    }

    const response = await this.apiRequest(config, 'POST', '/integrations/accountingparties', {
      name: customerInfo.name,
      taxNo: customerInfo.taxId || '',
      identityNo: customerInfo.identityNo || '',
      taxOffice: customerInfo.taxOffice || '',
      email: customerInfo.email || '',
      phoneNumber: customerInfo.phone || '',
      type: customerInfo.taxId ? 'Company' : 'Individual'
    });

    const data = await response.json();
    return data.id || data.accountingPartyId;
  }

  static async createInvoice(config, invoice, ettn) {
    // Müşteri kaydı
    const accountingPartyId = await this.ensureAccountingParty(config, invoice.customerInfo);

    // Ürünleri hazırla
    const products = invoice.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxes: [{
        taxCode: 'KDV',
        rate: item.taxRate || 20
      }]
    }));

    const body = {
      title: `Fatura ${invoice.invoiceNumber}`,
      type: 'Income',
      accountingPartyId,
      onDate: new Date().toISOString(),
      invoiceType: config.defaultInvoiceType || 'SATIS',
      profileId: config.defaultInvoiceProfile || 'EARSIVFATURA',
      externalReference: ettn,
      products
    };

    const response = await this.apiRequest(config, 'POST', '/integrations/transactions/income', body);
    const data = await response.json();

    return {
      transactionId: data.id || data.transactionId,
      status: 'sent_draft',
      accountingPartyId,
      rawResponse: data
    };
  }

  // GİB'e gönder (2. adım)
  static async formalizeInvoice(config, transactionId) {
    const response = await this.apiRequest(config, 'POST',
      '/integrations/transactions/income/formalize',
      { transactionId }
    );
    const data = await response.json();

    return {
      status: 'pending',
      rawResponse: data
    };
  }

  static async getInvoiceStatus(config, transactionId) {
    const response = await this.apiRequest(config, 'GET',
      `/integrations/transactions/income/${transactionId}`);
    const data = await response.json();

    const statusMap = {
      'Draft': 'sent_draft',
      'Pending': 'pending',
      'InProgress': 'in_progress',
      'Completed': 'completed',
      'Delayed': 'in_progress',
      'Unanswered': 'pending',
      'Error': 'error',
      'Canceled': 'cancelled',
      'CanceledByAdmin': 'cancelled'
    };

    return {
      status: statusMap[data.status] || 'pending',
      errorMessage: data.errorMessage || null,
      rawResponse: data
    };
  }

  static async getPdf(config, transactionId) {
    const fetch = (await import('node-fetch')).default;
    const token = await this.getToken(config);
    const baseUrl = this.getBaseUrl(config);
    const tenantId = config.bimasraf.tenantId;

    const response = await fetch(
      `${baseUrl}/tenant/${tenantId}/integrations/transactions/${transactionId}/pdf`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) throw new Error('Bimasraf PDF alınamadı');

    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      buffer,
      contentType: 'application/pdf',
      filename: `e-fatura-bimasraf-${transactionId}.pdf`
    };
  }

  static async cancelInvoice(config, transactionId) {
    const response = await this.apiRequest(config, 'PUT',
      `/integrations/transactions/income/${transactionId}/cancel`);
    const data = await response.json();
    return { rawResponse: data };
  }

  static async testConnection(config) {
    await this.getToken(config);
    // Parametreleri de çek bağlantı kontrolü için
    const response = await this.apiRequest(config, 'GET', '/integrations/parameters');
    await response.json();
    return { success: true, message: 'Bimasraf bağlantısı başarılı' };
  }
}

module.exports = BimasrafProvider;
