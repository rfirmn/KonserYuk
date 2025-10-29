const { Voucher } = require('../models');

const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: vouchers
    });
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data voucher'
    });
  }
};

const getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    console.error('Get voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data voucher'
    });
  }
};

const createVoucher = async (req, res) => {
  try {
    const { kode, diskon, aktif_dari, aktif_sampai } = req.body;

    const existingVoucher = await Voucher.findOne({ where: { kode } });
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: 'Kode voucher sudah ada'
      });
    }

    const voucher = await Voucher.create({
      kode,
      diskon,
      aktif_dari,
      aktif_sampai
    });

    res.status(201).json({
      success: true,
      message: 'Voucher berhasil ditambahkan',
      data: voucher
    });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan voucher'
    });
  }
};

const updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher tidak ditemukan'
      });
    }

    await voucher.update(req.body);

    res.json({
      success: true,
      message: 'Voucher berhasil diupdate',
      data: voucher
    });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate voucher'
    });
  }
};

const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher tidak ditemukan'
      });
    }

    await voucher.destroy();

    res.json({
      success: true,
      message: 'Voucher berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus voucher'
    });
  }
};

const validateVoucherCode = async (req, res) => {
  try {
    const { kode } = req.params;
    
    const voucher = await Voucher.findOne({ where: { kode } });
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher tidak ditemukan'
      });
    }

    const now = new Date();
    if (now < voucher.aktif_dari || now > voucher.aktif_sampai) {
      return res.status(400).json({
        success: false,
        message: 'Voucher tidak aktif'
      });
    }

    res.json({
      success: true,
      message: 'Voucher valid',
      data: voucher
    });
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memvalidasi voucher'
    });
  }
};

module.exports = {
  getAllVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucherCode
};