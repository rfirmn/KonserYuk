const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  }
}, {
  tableName: 'users',
  timestamps: true
});

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  lokasi: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  tanggal: {
    type: DataTypes.DATE,
    allowNull: false
  },
  harga: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  kuota: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  poster_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'events',
  timestamps: true
});

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  kode_qr: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('aktif', 'digunakan', 'expired'),
    defaultValue: 'aktif'
  },
  total_harga: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  waktu_beli: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tickets',
  timestamps: true
});

const Voucher = sequelize.define('Voucher', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  kode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  diskon: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Diskon dalam persen'
  },
  aktif_dari: {
    type: DataTypes.DATE,
    allowNull: false
  },
  aktif_sampai: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'vouchers',
  timestamps: true
});

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  total_bayar: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0
  },
  status_pembayaran: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'expired'),
    defaultValue: 'pending'
  },
  order_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  payment_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  transaction_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'transactions',
  timestamps: true
});

User.hasMany(Ticket, { foreignKey: 'user_id' });
Ticket.belongsTo(User, { foreignKey: 'user_id' });

Event.hasMany(Ticket, { foreignKey: 'event_id' });
Ticket.belongsTo(Event, { foreignKey: 'event_id' });

User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

Ticket.hasMany(Transaction, { foreignKey: 'ticket_id' });
Transaction.belongsTo(Ticket, { foreignKey: 'ticket_id' });

module.exports = {
  User,
  Event,
  Ticket,
  Voucher,
  Transaction,
  sequelize
};