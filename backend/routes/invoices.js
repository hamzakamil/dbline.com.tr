const express = require('express');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const InvoiceService = require('../services/invoiceService');
const EInvoiceService = require('../services/eInvoiceService');
const { protect, admin } = require('../middleware/auth');
const path = require('path');

const router = express.Router();

// Fatura oluştur (sipariş ID ile)
router.post('/:orderId', protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    // Bu siparişe ait fatura var mı?
    const existing = await Invoice.findOne({ order: order._id, status: { $ne: 'cancelled' } });
    if (existing) {
      return res.status(400).json({ message: 'Bu siparişe ait fatura zaten mevcut', invoice: existing });
    }

    const invoice = await InvoiceService.generateInvoice(order, req.user._id);

    // Siparişe fatura referansını ekle
    order.invoiceId = invoice._id;
    await order.save();

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Siparişe ait fatura getir
router.get('/order/:orderId', protect, admin, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      order: req.params.orderId,
      status: { $ne: 'cancelled' }
    });
    if (!invoice) {
      return res.status(404).json({ message: 'Fatura bulunamadı' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fatura PDF indir
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Fatura bulunamadı' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', 'invoices', `${invoice.invoiceNumber}.pdf`);
    res.download(filePath, `${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fatura detay
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('order');
    if (!invoice) {
      return res.status(404).json({ message: 'Fatura bulunamadı' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fatura listesi
router.get('/', protect, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find()
        .populate('order', 'totalAmount status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments()
    ]);

    res.json({ invoices, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fatura iptal
router.put('/:id/cancel', protect, admin, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Fatura bulunamadı' });
    }
    invoice.status = 'cancelled';
    await invoice.save();
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============== E-FATURA ENDPOINTS ===============

// E-fatura bağlantı testi (bu route :id parametreli route'lardan ÖNCE olmalı)
router.get('/e-invoice/test-connection', protect, admin, async (req, res) => {
  try {
    const result = await EInvoiceService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// E-faturaya gönder
router.post('/:id/e-invoice/submit', protect, admin, async (req, res) => {
  try {
    const invoice = await EInvoiceService.submitInvoice(req.params.id);
    res.json(invoice);
  } catch (error) {
    console.error('E-fatura gönderme hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// E-fatura onaylama (GİB'e gönder - Bimasraf 2. adım)
router.post('/:id/e-invoice/formalize', protect, admin, async (req, res) => {
  try {
    const invoice = await EInvoiceService.formalizeInvoice(req.params.id);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// E-fatura durum sorgula
router.get('/:id/e-invoice/status', protect, admin, async (req, res) => {
  try {
    const invoice = await EInvoiceService.checkStatus(req.params.id);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// E-fatura resmi PDF indir
router.get('/:id/e-invoice/pdf', protect, admin, async (req, res) => {
  try {
    const { buffer, contentType, filename } = await EInvoiceService.getOfficialPdf(req.params.id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// E-fatura iptal
router.put('/:id/e-invoice/cancel', protect, admin, async (req, res) => {
  try {
    const invoice = await EInvoiceService.cancelInvoice(req.params.id);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
