# 🎵 BBO Event - Web Penjualan Tiket Konser

Aplikasi web full-stack untuk manajemen dan penjualan tiket konser dengan sistem pembayaran terintegrasi menggunakan React.js dan Node.js + Express.js.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi](#-teknologi)
- [Struktur Proyek](#-struktur-proyek)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)

---

## ✨ Fitur Utama

### 👥 User Features
- ✅ Register & Login dengan JWT Authentication
- ✅ Browse dan search event konser
- ✅ Detail informasi event lengkap
- ✅ Pembelian tiket dengan Midtrans Payment Gateway
- ✅ E-ticket dengan QR Code via Email
- ✅ Riwayat pembelian tiket
- ✅ View dan download QR code tiket

### 🔐 Admin Features
- ✅ Dashboard dengan statistik penjualan
- ✅ CRUD Events (Create, Read, Update, Delete)
- ✅ Validasi tiket dengan QR Code Scanner
- ✅ Voucher management (Coming Soon)
- ✅ Laporan penjualan (Coming Soon)

---

## 🛠️ Teknologi

### Backend
- **Node.js** v14+
- **Express.js** - Web Framework
- **MySQL** - Database
- **Sequelize** - ORM
- **JWT** - Authentication
- **bcrypt** - Password Hashing
- **Midtrans** - Payment Gateway
- **Nodemailer** - Email Service
- **QR Code** - E-ticket Generator

### Frontend
- **React.js** v18
- **React Router** v6
- **Tailwind CSS** - Styling
- **Axios** - HTTP Client
- **React Toastify** - Notifications
- **QR Code React** - QR Display

---

## 📁 Struktur Proyek

```
bbo-event/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── event.controller.js
│   │   ├── ticket.controller.js
│   │   ├── voucher.controller.js
│   │   ├── transaction.controller.js
│   │   └── user.controller.js
│   ├── middlewares/
│   │   └── auth.js
│   ├── models/
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── event.routes.js
│   │   ├── ticket.routes.js
│   │   ├── voucher.routes.js
│   │   ├── transaction.routes.js
│   │   └── user.routes.js
│   ├── utils/
│   │   ├── email.js
│   │   ├── qrcode.js
│   │   └── midtrans.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── EventCard.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── LoadingPage.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Home.jsx
    │   │   ├── EventDetail.jsx
    │   │   ├── Checkout.jsx
    │   │   ├── History.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── AdminEvents.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── .env
    ├── .env.example
    ├── package.json
    └── tailwind.config.js
```

---

## 🚀 Instalasi

### Prerequisites
Pastikan sudah terinstall:
- Node.js (v14 atau lebih baru)
- MySQL (v5.7 atau lebih baru)
- npm atau yarn

### 1. Clone Repository

```bash
git clone <repository-url>
cd bbo-event
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## ⚙️ Konfigurasi

### Backend Configuration

1. Copy `.env.example` ke `.env`:
```bash
cd backend
cp .env.example .env
```

2. Edit file `.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bbo_event

JWT_SECRET=your_super_secret_jwt_key_min_32_characters

MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_SERVER_KEY
MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_CLIENT_KEY
MIDTRANS_IS_PRODUCTION=false

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration

1. Copy `.env.example` ke `.env`:
```bash
cd frontend
cp .env.example .env
```

2. Edit file `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Database Setup

```sql
CREATE DATABASE bbo_event CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Tables akan otomatis dibuat oleh Sequelize saat pertama kali server dijalankan.

---

## ▶️ Menjalankan Aplikasi

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server berjalan di `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Aplikasi berjalan di `http://localhost:3000`

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | - | Register user baru |
| POST | `/api/auth/login` | - | Login user |
| GET | `/api/auth/profile` | ✓ | Get user profile |

### Events
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/events` | - | - | Get all events |
| GET | `/api/events/:id` | - | - | Get event by ID |
| POST | `/api/events` | ✓ | Admin | Create event |
| PUT | `/api/events/:id` | ✓ | Admin | Update event |
| DELETE | `/api/events/:id` | ✓ | Admin | Delete event |

### Tickets
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/tickets/purchase` | ✓ | User | Purchase ticket |
| GET | `/api/tickets/validate/:qrcode` | ✓ | Admin | Validate ticket |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/:id/history` | ✓ | Get purchase history |
| PUT | `/api/users/:id` | ✓ | Update user profile |

### Vouchers
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/vouchers` | ✓ | Admin | Get all vouchers |
| POST | `/api/vouchers` | ✓ | Admin | Create voucher |
| PUT | `/api/vouchers/:id` | ✓ | Admin | Update voucher |
| DELETE | `/api/vouchers/:id` | ✓ | Admin | Delete voucher |

---

## 💾 Database Schema

### Table: users
```sql
id (INT, PK, AUTO_INCREMENT)
nama (VARCHAR 100)
email (VARCHAR 100, UNIQUE)
password (VARCHAR 255)
role (ENUM: 'user', 'admin')
createdAt (DATETIME)
updatedAt (DATETIME)
```

### Table: events
```sql
id (INT, PK, AUTO_INCREMENT)
nama (VARCHAR 200)
lokasi (VARCHAR 200)
tanggal (DATETIME)
harga (DECIMAL 10,2)
deskripsi (TEXT)
kuota (INT)
poster_url (VARCHAR 500)
createdAt (DATETIME)
updatedAt (DATETIME)
```

### Table: tickets
```sql
id (INT, PK, AUTO_INCREMENT)
user_id (INT, FK → users)
event_id (INT, FK → events)
kode_qr (VARCHAR 100, UNIQUE)
status (ENUM: 'aktif', 'digunakan', 'expired')
total_harga (DECIMAL 10,2)
waktu_beli (DATETIME)
createdAt (DATETIME)
updatedAt (DATETIME)
```

### Table: vouchers
```sql
id (INT, PK, AUTO_INCREMENT)
kode (VARCHAR 50, UNIQUE)
diskon (DECIMAL 5,2)
aktif_dari (DATETIME)
aktif_sampai (DATETIME)
createdAt (DATETIME)
updatedAt (DATETIME)
```

### Table: transactions
```sql
id (INT, PK, AUTO_INCREMENT)
user_id (INT, FK → users)
ticket_id (INT, FK → tickets)
status_pembayaran (ENUM: 'pending', 'success', 'failed', 'expired')
order_id (VARCHAR 100, UNIQUE)
payment_type (VARCHAR 50)
transaction_time (DATETIME)
createdAt (DATETIME)
updatedAt (DATETIME)
```

---

## 🎨 Design Theme

### Color Palette
- **Yellow**: `#FDB913`
- **Orange**: `#F37021`
- **Red**: `#C1272D`

### Gradient
```css
background: linear-gradient(135deg, #FDB913 0%, #F37021 50%, #C1272D 100%);
```

### Typography
- Font Family: **Poppins** (Google Fonts)

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
npx kill-port 5000
npx kill-port 3000
```

### MySQL Connection Error
- Pastikan MySQL service running
- Check credentials di `.env`
- Test: `mysql -u root -p`

### Email Not Sending
- Gunakan Gmail App Password
- Aktifkan 2-Step Verification
- Generate App Password di Google Account

### Midtrans Error
- Pastikan menggunakan Sandbox keys
- Verifikasi di Midtrans Dashboard
- Check Server Key dan Client Key

---

## 📄 License

MIT License - Free to use for personal and commercial projects

---

## 👨‍💻 Developer

Created with ❤️ for BBO Event

**Happy Coding! 🚀**