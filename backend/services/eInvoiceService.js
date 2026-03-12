const Settings = require('../models/Settings');
const Invoice = require('../models/Invoice');
const { v4: uuidv4 } = require('uuid');
const BimasrafProvider = require('./eInvoiceProviders/bimasrafProvider');
const NesProvider = require('./eInvoiceProviders/nesProvider');
const EdmProvider = require('./eInvoiceProviders/edmProvider');

class EInvoiceService {

  static async getConfig() {
    const settings = await Settings.findOne();
    return settings?.eInvoiceConfig || { enabled: false, provider: 'none' };
  }

  static getProvider(providerName) {
    switch (providerName) {
      case 'bimasraf': return BimasrafProvider;
      case 'nes': return NesProvider;
      case 'edm': return EdmProvider;
      default: throw new Error('Desteklenmeyen e-fatura sağlayıcısı: ' + providerName);
    }
  }

  // E-faturaya gönder
  static async submitInvoice(invoiceId) {
    const config = await this.getConfig();
    if (!config.enabled || config.provider === 'none') {
      throw new Error('E-fatura entegrasyonu aktif değil');
    }

    const invoice = await Invoice.findById(invoiceId).populate({
      path: 'order',
      populate: { path: 'user', select: 'name email' }
    });
    if (!invoice) throw new Error('Fatura bulunamadı');

    const provider = this.getProvider(config.provider);
    const ettn = uuidv4();

    try {
      const result = await provider.createInvoice(config, invoice, ettn);

      invoice.eInvoice = {
        enabled: true,
        provider: config.provider,
        ettn,
        providerTransactionId: result.transactionId,
        invoiceType: config.defaultInvoiceType || 'SATIS',
        invoiceProfile: config.defaultInvoiceProfile || 'EARSIVFATURA',
        eInvoiceStatus: result.status || 'sent_draft',
        providerResponse: result.rawResponse,
        sentAt: new Date(),
        accountingPartyId: result.accountingPartyId || null
      };
      invoice.status = 'submitted';
      await invoice.save();

      // Otomatik onaylama
      if (config.autoSubmit && provider.formalizeInvoice) {
        await this.formalizeInvoice(invoiceId);
      }

      return invoice;
    } catch (error) {
      invoice.eInvoice = {
        ...(invoice.eInvoice || {}),
        enabled: true,
        provider: config.provider,
        ettn,
        eInvoiceStatus: 'error',
        errorMessage: error.message
      };
      await invoice.save();
      throw error;
    }
  }

  // GİB'e onayla (Bimasraf 2-adımlı akış)
  static async formalizeInvoice(invoiceId) {
    const config = await this.getConfig();
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice?.eInvoice?.providerTransactionId) {
      throw new Error('E-fatura taslağı bulunamadı');
    }

    const provider = this.getProvider(config.provider);
    if (!provider.formalizeInvoice) {
      return invoice;
    }

    const result = await provider.formalizeInvoice(config, invoice.eInvoice.providerTransactionId);
    invoice.eInvoice.eInvoiceStatus = result.status || 'pending';
    invoice.eInvoice.providerResponse = result.rawResponse;
    await invoice.save();
    return invoice;
  }

  // Durum sorgula
  static async checkStatus(invoiceId) {
    const config = await this.getConfig();
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice?.eInvoice?.providerTransactionId) {
      throw new Error('E-fatura bilgisi bulunamadı');
    }

    const provider = this.getProvider(config.provider);
    const result = await provider.getInvoiceStatus(config, invoice.eInvoice.providerTransactionId);

    invoice.eInvoice.eInvoiceStatus = result.status;
    invoice.eInvoice.providerResponse = result.rawResponse;
    if (result.status === 'completed') {
      invoice.eInvoice.completedAt = new Date();
    }
    if (result.errorMessage) {
      invoice.eInvoice.errorMessage = result.errorMessage;
    }
    await invoice.save();
    return invoice;
  }

  // Resmi PDF indir
  static async getOfficialPdf(invoiceId) {
    const config = await this.getConfig();
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice?.eInvoice?.providerTransactionId) {
      throw new Error('E-fatura bilgisi bulunamadı');
    }

    const provider = this.getProvider(config.provider);
    return provider.getPdf(config, invoice.eInvoice.providerTransactionId);
  }

  // E-fatura iptal
  static async cancelInvoice(invoiceId) {
    const config = await this.getConfig();
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice?.eInvoice?.providerTransactionId) {
      throw new Error('E-fatura bilgisi bulunamadı');
    }

    const provider = this.getProvider(config.provider);
    const result = await provider.cancelInvoice(config, invoice.eInvoice.providerTransactionId);

    invoice.eInvoice.eInvoiceStatus = 'cancelled';
    invoice.status = 'cancelled';
    invoice.eInvoice.providerResponse = result.rawResponse;
    await invoice.save();
    return invoice;
  }

  // Bağlantı testi
  static async testConnection() {
    const config = await this.getConfig();
    if (!config.enabled || config.provider === 'none') {
      throw new Error('E-fatura sağlayıcısı seçilmemiş');
    }
    const provider = this.getProvider(config.provider);
    return provider.testConnection(config);
  }
}

module.exports = EInvoiceService;
