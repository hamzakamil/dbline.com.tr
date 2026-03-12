const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Invoice = require('../models/Invoice');
const Settings = require('../models/Settings');

class InvoiceService {

  static async generateInvoice(order, userId) {
    // Fatura bilgilerini Settings'den çek
    const settings = await Settings.findOne();
    const config = settings?.invoiceConfig || {};

    // Fatura numarası oluştur
    const prefix = config.numberPrefix || 'INV';
    const invoiceNumber = await Invoice.generateNumber(prefix);

    // Ürün satırları
    const taxRate = config.defaultTaxRate || 20;
    const items = order.items.map(item => {
      const totalPrice = item.price * item.quantity;
      return {
        name: item.name || 'Ürün',
        quantity: item.quantity,
        unitPrice: item.price,
        taxRate,
        totalPrice
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = order.totalAmount;

    // Invoice kaydı oluştur
    const invoice = await Invoice.create({
      invoiceNumber,
      order: order._id,
      companyInfo: {
        name: config.companyName || settings?.siteName || 'DB Line Official',
        taxId: config.taxId || '',
        taxOffice: config.taxOffice || '',
        address: config.address || settings?.contact?.address || '',
        phone: config.phone || settings?.contact?.phone || '',
        email: config.email || settings?.contact?.email || ''
      },
      customerInfo: {
        name: order.shippingAddress.fullName,
        address: `${order.shippingAddress.street}, ${order.shippingAddress.district}, ${order.shippingAddress.city}`,
        phone: order.shippingAddress.phone,
        email: order.user?.email || ''
      },
      items,
      subtotal,
      taxAmount,
      shippingCost: order.shippingCost || 0,
      discountAmount: order.discountAmount || 0,
      totalAmount,
      issuedBy: userId
    });

    // PDF oluştur
    const pdfPath = await InvoiceService.generatePDF(invoice, config);
    invoice.pdfUrl = `/uploads/invoices/${path.basename(pdfPath)}`;
    await invoice.save();

    // E-fatura otomatik gönderim
    const eInvoiceConfig = settings?.eInvoiceConfig;
    if (eInvoiceConfig?.enabled && eInvoiceConfig?.autoSubmit && eInvoiceConfig?.provider !== 'none') {
      try {
        const EInvoiceService = require('./eInvoiceService');
        await EInvoiceService.submitInvoice(invoice._id);
      } catch (eInvoiceError) {
        console.error('E-fatura otomatik gönderim hatası:', eInvoiceError.message);
      }
    }

    return invoice;
  }

  static async generatePDF(invoice, config = {}) {
    const dir = path.join(__dirname, '..', 'uploads', 'invoices');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, `${invoice.invoiceNumber}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Başlık
    doc.fontSize(20).font('Helvetica-Bold')
      .text(invoice.companyInfo.name || 'DB Line Official', 50, 50);

    doc.fontSize(10).font('Helvetica')
      .text(invoice.companyInfo.address || '', 50, 75)
      .text(`Tel: ${invoice.companyInfo.phone || '-'}`, 50, 88)
      .text(`E-posta: ${invoice.companyInfo.email || '-'}`, 50, 101);

    if (invoice.companyInfo.taxId) {
      doc.text(`VKN: ${invoice.companyInfo.taxId}`, 50, 114);
      doc.text(`Vergi Dairesi: ${invoice.companyInfo.taxOffice || ''}`, 50, 127);
    }

    // Fatura bilgileri (sağ üst)
    doc.fontSize(16).font('Helvetica-Bold')
      .text('FATURA', 400, 50, { align: 'right' });

    doc.fontSize(10).font('Helvetica')
      .text(`Fatura No: ${invoice.invoiceNumber}`, 350, 75, { align: 'right' })
      .text(`Tarih: ${new Date(invoice.issuedAt).toLocaleDateString('tr-TR')}`, 350, 88, { align: 'right' });

    // Çizgi
    doc.moveTo(50, 150).lineTo(545, 150).stroke('#cccccc');

    // Müşteri bilgileri
    doc.fontSize(11).font('Helvetica-Bold')
      .text('Müşteri Bilgileri', 50, 165);

    doc.fontSize(10).font('Helvetica')
      .text(invoice.customerInfo.name, 50, 182)
      .text(invoice.customerInfo.address || '', 50, 195)
      .text(`Tel: ${invoice.customerInfo.phone || '-'}`, 50, 208);

    if (invoice.customerInfo.taxId) {
      doc.text(`VKN: ${invoice.customerInfo.taxId}`, 50, 221);
    }

    // Ürün Tablosu
    let y = 255;
    const colWidths = { name: 200, qty: 60, unit: 80, tax: 60, total: 95 };
    const startX = 50;

    // Tablo başlık
    doc.rect(startX, y, 495, 22).fill('#f3f4f6');
    doc.fontSize(9).font('Helvetica-Bold').fill('#374151')
      .text('Ürün', startX + 8, y + 6)
      .text('Adet', startX + colWidths.name + 8, y + 6, { width: colWidths.qty, align: 'center' })
      .text('Birim Fiyat', startX + colWidths.name + colWidths.qty + 8, y + 6, { width: colWidths.unit, align: 'right' })
      .text('KDV %', startX + colWidths.name + colWidths.qty + colWidths.unit + 8, y + 6, { width: colWidths.tax, align: 'center' })
      .text('Toplam', startX + colWidths.name + colWidths.qty + colWidths.unit + colWidths.tax + 8, y + 6, { width: colWidths.total, align: 'right' });

    y += 25;
    doc.fill('#111111');

    // Ürün satırları
    for (const item of invoice.items) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(9).font('Helvetica')
        .text(item.name, startX + 8, y + 4, { width: colWidths.name - 16 })
        .text(String(item.quantity), startX + colWidths.name + 8, y + 4, { width: colWidths.qty, align: 'center' })
        .text(`₺${item.unitPrice.toFixed(2)}`, startX + colWidths.name + colWidths.qty + 8, y + 4, { width: colWidths.unit, align: 'right' })
        .text(`%${item.taxRate}`, startX + colWidths.name + colWidths.qty + colWidths.unit + 8, y + 4, { width: colWidths.tax, align: 'center' })
        .text(`₺${item.totalPrice.toFixed(2)}`, startX + colWidths.name + colWidths.qty + colWidths.unit + colWidths.tax + 8, y + 4, { width: colWidths.total, align: 'right' });

      y += 20;
      doc.moveTo(startX, y).lineTo(545, y).stroke('#e5e7eb');
      y += 3;
    }

    // Toplamlar
    y += 15;
    const totalX = 380;
    const valX = 460;

    doc.fontSize(10).font('Helvetica')
      .text('Ara Toplam:', totalX, y, { align: 'left' })
      .text(`₺${invoice.subtotal.toFixed(2)}`, valX, y, { align: 'right', width: 85 });

    y += 18;
    doc.text(`KDV (%${invoice.items[0]?.taxRate || 20}):`, totalX, y)
      .text(`₺${invoice.taxAmount.toFixed(2)}`, valX, y, { align: 'right', width: 85 });

    if (invoice.shippingCost > 0) {
      y += 18;
      doc.text('Kargo:', totalX, y)
        .text(`₺${invoice.shippingCost.toFixed(2)}`, valX, y, { align: 'right', width: 85 });
    }

    if (invoice.discountAmount > 0) {
      y += 18;
      doc.text('İndirim:', totalX, y)
        .text(`-₺${invoice.discountAmount.toFixed(2)}`, valX, y, { align: 'right', width: 85 });
    }

    y += 22;
    doc.moveTo(totalX, y).lineTo(545, y).stroke('#374151');
    y += 8;
    doc.fontSize(12).font('Helvetica-Bold')
      .text('TOPLAM:', totalX, y)
      .text(`₺${invoice.totalAmount.toFixed(2)}`, valX, y, { align: 'right', width: 85 });

    // Alt bilgi
    doc.fontSize(8).font('Helvetica').fill('#9ca3af')
      .text(`Bu fatura ${invoice.companyInfo.name} tarafından oluşturulmuştur.`, 50, 760, { align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }
}

module.exports = InvoiceService;
