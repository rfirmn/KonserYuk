# 🎵 BBO Event - Web Penjualan Tiket Konser

Aplikasi web lengkap untuk manajemen dan penjualan tiket konser dengan sistem pembayaran terintegrasi.

## 📋 Daftar Isi

- [Teknologi](#teknologi)
- [Fitur Utama](#fitur-utama)
- [Prerequisites](#prerequisites)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Database](#struktur-database)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🛠️ Teknologi

### Backend
- Node.js + Express.js
- MySQL + Sequelize ORM
- JWT Authentication
- bcrypt (password hashing)
- Midtrans Payment Gateway
- Nodemailer (Email notifications)
- QR Code Generator

### Frontend
- React.js 18
- React Router v6
- Tailwind CSS
- Axios
- React Toastify
- QR Code React

## ✨ Fitur Utama

### User
- 🔐 Register & Login dengan JWT
- 🎫 Browse dan cari event konser
- 💳 Pembayaran via Midtrans (QRIS, E-wallet, Transfer)
- 📧 E-ticket via email dengan QR Code
- 📜 Riwayat pembelian tiket
- 🎟️ Lihat QR code tiket

### Admin
- 📊 Dashboard dengan statistik
- ➕ CRUD Event (Create, Read, Update, Delete)
- 🎟️ Validasi tiket dengan QR scanner
- 💰 Kelola voucher diskon
- 📈 Laporan penjualan

## 📦 Prerequisites

Pastikan sudah terinstall:
- Node.js (v14 atau lebih baru)
- MySQL (v5.7 atau lebih baru)
- npm atau yarn
- Git

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/your-username/bbo-event.git
cd bbo-event
```

### 2. Setup Backend

```bash
cd backend
npm install
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

## ⚙️ Konfigurasi

### Backend Environment Variables

Buat file `.env` di folder `backend/`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bbo_event

# JWT Secret (Generate random string)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters

# Midtrans Configuration
MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_SERVER_KEY
MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_CLIENT_KEY
MIDTRANS_IS_PRODUCTION=false

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Cara Mendapatkan Gmail App Password:
1. Buka Google Account Settings
2. Security → 2-Step Verification (aktifkan jika belum)
3. App passwords → Generate new app password
4. Pilih "Mail" dan "Other" (Custom name)
5. Copy password yang dihasilkan

#### Cara Mendapatkan Midtrans Keys:
1. Daftar di https://dashboard.midtrans.com
2. Pilih Sandbox Environment
3. Settings → Access Keys
4. Copy Server Key dan Client Key

### Frontend Environment Variables

Buat file `.env` di folder `frontend/`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Database Setup

1. Buat database MySQL:

```sql
CREATE DATABASE bbo_event CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Tables akan otomatis dibuat saat pertama kali menjalankan server (Sequelize auto-sync)

## ▶️ Menjalankan Aplikasi

### Development Mode

1. **Jalankan Backend** (Terminal 1):
```bash
cd backend
npm run dev
```
Server berjalan di `http://localhost:5000`

2. **Jalankan Frontend** (Terminal 2):
```bash
cd frontend
npm start
```
Aplikasi berjalan di `http://localhost:3000`

### Production Mode

```bash
# Backend
cd backend
npm start

# Frontend (Build)
cd frontend
npm run build
```

## 🗄️ Struktur Database

### Table: users
```sql
- id (INT, PK, AUTO_INCREMENT)
- nama (VARCHAR 100)
- email (VARCHAR 100, UNIQUE)
- password (VARCHAR 255)
- role (ENUM: 'user', 'admin')
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

### Table: events
```sql
- id (INT, PK, AUTO_INCREMENT)
- nama (VARCHAR 200)
- lokasi (VARCHAR 200)
- tanggal (DATETIME)
- harga (DECIMAL 10,2)
- deskripsi (TEXT)
- kuota (INT)
- poster_url (VARCHAR 500)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

### Table: tickets
```sql
- id (INT, PK, AUTO_INCREMENT)
- user_id (INT, FK → users)
- event_id (INT, FK → events)
- kode_qr (VARCHAR 100, UNIQUE)
- status (ENUM: 'aktif', 'digunakan', 'expired')
- total_harga (DECIMAL 10,2)
- waktu_beli (DATETIME)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

### Table: vouchers
```sql
- id (INT, PK, AUTO_INCREMENT)
- kode (VARCHAR 50, UNIQUE)
- diskon (DECIMAL 5,2) -- persentase
- aktif_dari (DATETIME)
- aktif_sampai (DATETIME)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

### Table: transactions
```sql
- id (INT, PK, AUTO_INCREMENT)
- user_id (INT, FK → users)
- ticket_id (INT, FK → tickets)
- status_pembayaran (ENUM: 'pending', 'success', 'failed', 'expired')
- order_id (VARCHAR 100, UNIQUE)
- payment_type (VARCHAR 50)
- transaction_time (DATETIME)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

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

### Vouchers

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/vouchers` | ✓ | Admin | Get all vouchers |
| GET | `/api/vouchers/:id` | ✓ | Admin | Get voucher by ID |
| GET | `/api/vouchers/validate/:kode` | ✓ | User | Validate voucher code |
| POST | `/api/vouchers` | ✓ | Admin | Create voucher |
| PUT | `/api/vouchers/:id` | ✓ | Admin | Update voucher |
| DELETE | `/api/vouchers/:id` | ✓ | Admin | Delete voucher |

### Transactions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/transactions/notification` | - | Midtrans webhook |
| GET | `/api/transactions` | ✓ (Admin) | Get all transactions |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/:id/history` | ✓ | Get purchase history |
| PUT | `/api/users/:id` | ✓ | Update user profile |

## 🎨 Tema Desain

Aplikasi menggunakan tema warna BBO Event:
- **Yellow**: `#FDB913`
- **Orange**: `#F37021`
- **Red**: `#C1272D`

Gradient background:
```css
background: linear-gradient(135deg, #FDB913 0%, #F37021 50%, #C1272D 100%);
```

Font family: **Poppins** (Google Fonts)

## 📱 Fitur Halaman

### User Flow
1. **Loading Page** - Animasi loading dengan branding BBO
2. **Login/Register** - Form auth dengan tema BBO
3. **Homepage** - Daftar event dengan search & filter
4. **Event Detail** - Informasi lengkap event
5. **Checkout** - Form pembayaran dengan Midtrans
6. **History** - Riwayat tiket dengan QR code

### Admin Flow
1. **Dashboard** - Statistik dan quick actions
2. **Manage Events** - CRUD events dengan modal
3. **Validate Tickets** - Scanner QR code
4. **Voucher Management** - CRUD vouchers

## 🚀 Deployment

### Backend (Railway/Render)

1. **Push ke GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/bbo-event.git
git push -u origin main
```

2. **Deploy ke Railway**
- Buka https://railway.app
- New Project → Deploy from GitHub
- Select repository
- Add Environment Variables (copy dari .env)
- Deploy

3. **Database (PlanetScale)**
- Buka https://planetscale.com
- Create database
- Copy connection string
- Update environment variables

### Frontend (Vercel)

1. **Deploy ke Vercel**
```bash
cd frontend
npm run build
npx vercel --prod
```

2. **Set Environment Variables**
- REACT_APP_API_URL → URL backend Railway

## 🐛 Troubleshooting

### Port sudah digunakan
```bash
# Kill process di port 5000 atau 3000
npx kill-port 5000
npx kill-port 3000
```

### MySQL Connection Error
- Pastikan MySQL service running
- Check credentials di .env
- Test connection: `mysql -u root -p`

### CORS Error
- Pastikan FRONTEND_URL di backend .env benar
- Check CORS configuration di server.js

### Email tidak terkirim
- Gunakan Gmail App Password, bukan password biasa
- Aktifkan 2-Step Verification di Google Account
- Check EMAIL_USER dan EMAIL_PASSWORD di .env

### Midtrans Error
- Pastikan menggunakan Sandbox keys untuk development
- Check MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY
- Verifikasi di Midtrans Dashboard

## 📄 License

MIT License - Free to use for personal and commercial projects

## 👨‍💻 Developer

Dibuat dengan ❤️ untuk BBO Event

---

## 📞 Support

Jika ada pertanyaan atau masalah:
- Create issue di GitHub
- Email: support@bboevent.com

## 🎯 Roadmap

- [ ] Payment gateway tambahan (GoPay, OVO, Dana)
- [ ] Seat selection untuk venue tertentu
- [ ] Notifikasi push
- [ ] Mobile app (React Native)
- [ ] Social media integration
- [ ] Review & rating system
- [ ] Referral program

---

**Happy Coding! 🚀**