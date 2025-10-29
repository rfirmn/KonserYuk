const { Event } = require('../models');
const { Op } = require('sequelize');

const getAllEvents = async (req, res) => {
  try {
    const { search, lokasi, tanggal, minHarga, maxHarga } = req.query;
    
    let whereClause = {};
    
    if (search) {
      whereClause.nama = { [Op.like]: `%${search}%` };
    }
    
    if (lokasi) {
      whereClause.lokasi = { [Op.like]: `%${lokasi}%` };
    }
    
    if (tanggal) {
      whereClause.tanggal = { [Op.gte]: new Date(tanggal) };
    }
    
    if (minHarga && maxHarga) {
      whereClause.harga = { [Op.between]: [minHarga, maxHarga] };
    }

    const events = await Event.findAll({
      where: whereClause,
      order: [['tanggal', 'ASC']]
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data event'
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data event'
    });
  }
};

const createEvent = async (req, res) => {
  try {
    const { nama, lokasi, tanggal, harga, deskripsi, kuota, poster_url } = req.body;

    const event = await Event.create({
      nama,
      lokasi,
      tanggal,
      harga,
      deskripsi,
      kuota,
      poster_url
    });

    res.status(201).json({
      success: true,
      message: 'Event berhasil ditambahkan',
      data: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan event'
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan'
      });
    }

    await event.update(req.body);

    res.json({
      success: true,
      message: 'Event berhasil diupdate',
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate event'
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan'
      });
    }

    await event.destroy();

    res.json({
      success: true,
      message: 'Event berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus event'
    });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};