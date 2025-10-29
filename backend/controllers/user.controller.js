const { User, Ticket, Event, Transaction } = require('../models');

const getUserHistory = async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }

    const tickets = await Ticket.findAll({
      where: { user_id: userId },
      include: [
        { model: Event },
        { model: Transaction }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error('Get user history error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat pembelian'
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }

    const { nama, email } = req.body;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    await user.update({ nama, email });

    res.json({
      success: true,
      message: 'Profil berhasil diupdate',
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate profil'
    });
  }
};

module.exports = {
  getUserHistory,
  updateUserProfile
};