// EDM Bilişim E-Fatura Provider (SOAP/WSDL)
// WSDL: https://test.edmbilisim.com.tr/EFaturaEDM21ea/EFaturaEDM.svc?wsdl

const soap = require('soap');

let sessionCache = { sessionId: null, expiresAt: null };
let soapClientCache = null;

class EdmProvider {

  static async getSoapClient(config) {
    if (soapClientCache) return soapClientCache;

    const wsdlUrl = config.testMode
      ? (config.edm.testWsdlUrl || 'https://test.edmbilisim.com.tr/EFaturaEDM21ea/EFaturaEDM.svc?wsdl')
      : config.edm.prodWsdlUrl;

    if (!wsdlUrl) throw new Error('EDM WSDL URL tanımlı değil');

    soapClientCache = await soap.createClientAsync(wsdlUrl, {
      wsdl_options: { timeout: 30000 }
    });
    return soapClientCache;
  }

  static async getSession(config) {
    if (sessionCache.sessionId && sessionCache.expiresAt > Date.now()) {
      return sessionCache.sessionId;
    }

    const client = await this.getSoapClient(config);

    const [result] = await client.LoginAsync({
      REQUEST_HEADER: {
        SESSION_ID: '',
        APPLICATION_NAME: 'DBLine',
        CHANNEL_NAME: 'DBLine'
      },
      USER_NAME: config.edm.username,
      PASSWORD: config.edm.password
    });

    if (!result || !result.SESSION_ID) {
      throw new Error('EDM login hatası: SessionID alınamadı');
    }

    sessionCache = {
      sessionId: result.SESSION_ID,
      expiresAt: Date.now() + (25 * 60 * 1000) // 25 dk
    };
    return sessionCache.sessionId;
  }

  // UBL 2.1 TR formatında XML oluştur
  static buildUblXml(invoice, ettn) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    // KDV hesaplamaları
    const taxGroups = {};
    invoice.items.forEach(item => {
      const rate = item.taxRate || 20;
      if (!taxGroups[rate]) {
        taxGroups[rate] = { taxableAmount: 0, taxAmount: 0 };
      }
      const lineTotal = item.quantity * item.unitPrice;
      taxGroups[rate].taxableAmount += lineTotal;
      taxGroups[rate].taxAmount += lineTotal * rate / 100;
    });

    // Fatura kalemleri XML
    const invoiceLines = invoice.items.map((item, idx) => {
      const lineTotal = item.quantity * item.unitPrice;
      const taxRate = item.taxRate || 20;
      const taxAmount = lineTotal * taxRate / 100;
      return `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="C62">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="TRY">${lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="TRY">${taxAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="TRY">${lineTotal.toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="TRY">${taxAmount.toFixed(2)}</cbc:TaxAmount>
          <cbc:Percent>${taxRate}</cbc:Percent>
          <cac:TaxCategory>
            <cac:TaxScheme>
              <cbc:Name>KDV</cbc:Name>
              <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${this.escapeXml(item.name)}</cbc:Name>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="TRY">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
    }).join('');

    // KDV toplam XML
    const taxSubtotals = Object.entries(taxGroups).map(([rate, amounts]) => `
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="TRY">${amounts.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="TRY">${amounts.taxAmount.toFixed(2)}</cbc:TaxAmount>
          <cbc:Percent>${rate}</cbc:Percent>
          <cac:TaxCategory>
            <cac:TaxScheme>
              <cbc:Name>KDV</cbc:Name>
              <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>`).join('');

    const invoiceTypeCode = invoice.eInvoice?.invoiceType || 'SATIS';
    const profileId = invoice.eInvoice?.invoiceProfile || 'EARSIVFATURA';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>${profileId}</cbc:ProfileID>
  <cbc:ID>${invoice.invoiceNumber}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${ettn}</cbc:UUID>
  <cbc:IssueDate>${dateStr}</cbc:IssueDate>
  <cbc:IssueTime>${timeStr}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>${invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${invoice.items.length}</cbc:LineCountNumeric>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">${invoice.companyInfo.taxId || ''}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${this.escapeXml(invoice.companyInfo.name || '')}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${this.escapeXml(invoice.companyInfo.address || '')}</cbc:StreetName>
        <cac:Country>
          <cbc:Name>Türkiye</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${this.escapeXml(invoice.companyInfo.name || '')}</cbc:RegistrationName>
        <cac:TaxScheme>
          <cbc:Name>${this.escapeXml(invoice.companyInfo.taxOffice || '')}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        <cbc:Telephone>${invoice.companyInfo.phone || ''}</cbc:Telephone>
        <cbc:ElectronicMail>${invoice.companyInfo.email || ''}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${invoice.customerInfo.taxId ? 'VKN' : 'TCKN'}">${invoice.customerInfo.taxId || ''}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${this.escapeXml(invoice.customerInfo.name || '')}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${this.escapeXml(invoice.customerInfo.address || '')}</cbc:StreetName>
        <cac:Country>
          <cbc:Name>Türkiye</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      ${invoice.customerInfo.taxOffice ? `<cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${this.escapeXml(invoice.customerInfo.taxOffice)}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
      <cac:Contact>
        <cbc:Telephone>${invoice.customerInfo.phone || ''}</cbc:Telephone>
        <cbc:ElectronicMail>${invoice.customerInfo.email || ''}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">${(invoice.taxAmount || 0).toFixed(2)}</cbc:TaxAmount>
    ${taxSubtotals}
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">${(invoice.subtotal || 0).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">${(invoice.subtotal || 0).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">${(invoice.totalAmount || 0).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="TRY">${(invoice.discountAmount || 0).toFixed(2)}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="TRY">${(invoice.totalAmount || 0).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  ${invoiceLines}
</Invoice>`;

    return Buffer.from(xml, 'utf-8').toString('base64');
  }

  static escapeXml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  static async createInvoice(config, invoice, ettn) {
    const sessionId = await this.getSession(config);
    const client = await this.getSoapClient(config);
    const ublContent = this.buildUblXml(invoice, ettn);

    const requestHeader = {
      SESSION_ID: sessionId,
      APPLICATION_NAME: 'DBLine'
    };

    try {
      const [result] = await client.SendInvoiceAsync({
        REQUEST_HEADER: requestHeader,
        SENDER: {
          vkn: invoice.companyInfo.taxId || '',
          alias: 'urn:mail:defaultpk@' + (invoice.companyInfo.taxId || '')
        },
        RECEIVER: {
          vkn: invoice.customerInfo.taxId || '',
          alias: 'urn:mail:defaultpk@' + (invoice.customerInfo.taxId || '')
        },
        INVOICE: [{
          HEADER: {
            SENDER: invoice.companyInfo.taxId || '',
            RECEIVER: invoice.customerInfo.taxId || '',
            SUPPLIER: invoice.companyInfo.taxId || '',
            CUSTOMER: invoice.customerInfo.taxId || '',
            INVOICE_HASH: '',
            DIRECTION: 'OUT'
          },
          CONTENT: {
            attributes: { VALUE: ublContent }
          },
          ID: invoice.invoiceNumber,
          UUID: ettn
        }]
      });

      return {
        transactionId: result?.REQUEST_RETURN?.RETURN_CODE === '0'
          ? ettn
          : (result?.INVOICE?.[0]?.ID || ettn),
        status: 'pending',
        rawResponse: result
      };
    } catch (error) {
      // Session expired, retry
      if (error.message && error.message.includes('session')) {
        sessionCache = { sessionId: null, expiresAt: null };
        const newSessionId = await this.getSession(config);
        requestHeader.SESSION_ID = newSessionId;

        const [result] = await client.SendInvoiceAsync({
          REQUEST_HEADER: requestHeader,
          INVOICE: [{
            CONTENT: { attributes: { VALUE: ublContent } },
            ID: invoice.invoiceNumber,
            UUID: ettn
          }]
        });

        return {
          transactionId: ettn,
          status: 'pending',
          rawResponse: result
        };
      }
      throw error;
    }
  }

  // EDM tek adımlı - SendInvoice direkt GİB'e gönderir
  static formalizeInvoice = null;

  static async getInvoiceStatus(config, transactionId) {
    const sessionId = await this.getSession(config);
    const client = await this.getSoapClient(config);

    const [result] = await client.GetInvoiceStatusAsync({
      REQUEST_HEADER: {
        SESSION_ID: sessionId,
        APPLICATION_NAME: 'DBLine'
      },
      INVOICE: {
        UUID: transactionId
      }
    });

    const invoiceStatus = result?.INVOICE_STATUS;
    let status = 'pending';

    if (invoiceStatus) {
      const statusCode = invoiceStatus.STATUS_CODE || invoiceStatus.ENVELOPE_STATUS || '';
      const statusMap = {
        'SUCCEED': 'completed',
        'WAIT': 'pending',
        'PROCESSING': 'in_progress',
        'ERROR': 'error',
        'CANCELLED': 'cancelled',
        'APPROVE': 'completed',
        'REJECT': 'error'
      };
      status = statusMap[statusCode.toUpperCase()] || 'pending';
    }

    return {
      status,
      errorMessage: invoiceStatus?.STATUS_DESCRIPTION || null,
      rawResponse: result
    };
  }

  static async getPdf(config, transactionId) {
    const sessionId = await this.getSession(config);
    const client = await this.getSoapClient(config);

    const [result] = await client.GetInvoiceAsync({
      REQUEST_HEADER: {
        SESSION_ID: sessionId,
        APPLICATION_NAME: 'DBLine'
      },
      INVOICE_SEARCH_KEY: {
        UUID: transactionId,
        READ_INCLUDED: true
      },
      HEADER_ONLY: 'N',
      CONTENT_TYPE: 'PDF'
    });

    const invoiceData = result?.INVOICE?.[0];
    if (!invoiceData?.CONTENT) {
      throw new Error('EDM PDF alınamadı');
    }

    const buffer = Buffer.from(invoiceData.CONTENT, 'base64');
    return {
      buffer,
      contentType: 'application/pdf',
      filename: `e-fatura-edm-${transactionId}.pdf`
    };
  }

  static async cancelInvoice(config, transactionId) {
    const sessionId = await this.getSession(config);
    const client = await this.getSoapClient(config);

    const [result] = await client.CancelInvoiceAsync({
      REQUEST_HEADER: {
        SESSION_ID: sessionId,
        APPLICATION_NAME: 'DBLine'
      },
      INVOICE: {
        UUID: transactionId
      }
    });

    return { rawResponse: result };
  }

  static async testConnection(config) {
    await this.getSession(config);
    return { success: true, message: 'EDM Bilişim bağlantısı başarılı' };
  }
}

module.exports = EdmProvider;
