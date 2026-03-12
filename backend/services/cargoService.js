const Settings = require('../models/Settings');
const Shipment = require('../models/Shipment');

class CargoService {

  // Takip URL'lerini oluştur
  static getTrackingUrl(trackingNumber, provider) {
    const urls = {
      yurtici: `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${trackingNumber}`,
      aras: `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${trackingNumber}`,
      mng: `https://www.mngkargo.com.tr/gonderi-takip/${trackingNumber}`,
      ptt: `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${trackingNumber}`,
      manual: ''
    };
    return urls[provider] || '';
  }

  // Provider adını döndür
  static getProviderName(provider, locale = 'tr') {
    const names = {
      yurtici: { tr: 'Yurtiçi Kargo', en: 'Yurtiçi Kargo' },
      aras: { tr: 'Aras Kargo', en: 'Aras Kargo' },
      mng: { tr: 'MNG Kargo', en: 'MNG Kargo' },
      ptt: { tr: 'PTT Kargo', en: 'PTT Kargo' },
      manual: { tr: 'Manuel', en: 'Manual' }
    };
    return names[provider]?.[locale] || provider;
  }

  // Gönderi oluştur
  static async createShipment(order, { provider, trackingNumber, userId }) {
    const settings = await Settings.findOne();
    const cargoProvider = provider || settings?.cargoConfig?.defaultProvider || 'manual';
    const trackingUrl = CargoService.getTrackingUrl(trackingNumber, cargoProvider);

    // Mevcut gönderi var mı kontrol et
    let shipment = await Shipment.findOne({ order: order._id });

    if (shipment) {
      // Güncelle
      shipment.provider = cargoProvider;
      shipment.trackingNumber = trackingNumber;
      shipment.trackingUrl = trackingUrl;
      shipment.statusHistory.push({
        status: 'created',
        description: `Gönderi güncellendi: ${trackingNumber}`
      });
      await shipment.save();
    } else {
      // Yeni oluştur
      shipment = await Shipment.create({
        order: order._id,
        provider: cargoProvider,
        trackingNumber,
        trackingUrl,
        status: 'created',
        statusHistory: [{
          status: 'created',
          description: `Gönderi oluşturuldu: ${trackingNumber}`
        }],
        createdBy: userId
      });
    }

    return shipment;
  }

  // Gönderi durumunu güncelle
  static async updateShipmentStatus(shipmentId, newStatus, description = '') {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) throw new Error('Gönderi bulunamadı');

    shipment.status = newStatus;
    shipment.statusHistory.push({
      status: newStatus,
      description: description || `Durum güncellendi: ${newStatus}`
    });

    await shipment.save();
    return shipment;
  }

  // Siparişe ait gönderi bilgisi
  static async getShipmentByOrder(orderId) {
    return Shipment.findOne({ order: orderId });
  }
}

module.exports = CargoService;
