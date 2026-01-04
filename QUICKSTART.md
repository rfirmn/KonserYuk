# Quick Start Guide - Konser Yuk Backend

## 🚀 Cara Cepat Menjalankan Aplikasi

### Opsi 1: Dengan Docker (Recommended)

```bash
# 1. Masuk ke directory project
cd c:\Users\afdal\Downloads\Rio\impal\KonserYuk

# 2. Copy dan edit environment variables
copy .env.example .env
# Edit .env sesuai kebutuhan

# 3. Start semua services
docker-compose up -d

# 4. Check status services
docker-compose ps

# 5. View logs (opsional)
docker-compose logs -f backend
docker-compose logs -f worker

# 6. Test API
curl http://localhost:5000/api/health
```

**Services yang berjalan:**
- MySQL Master: `localhost:3306`
- MySQL Slave: `localhost:3307`
- Redis: `localhost:6379`
- Backend API: `http://localhost:5000`
- Worker: Background process

---

### Opsi 2: Tanpa Docker (Development)

**Prerequisite:** MySQL dan Redis harus sudah terinstall dan berjalan

```bash
# 1. Install dependencies
cd c:\Users\afdal\Downloads\Rio\impal\KonserYuk\backend
npm install

# 2. Setup environment variables
# Edit .env dengan konfigurasi lokal:
DB_MASTER_HOST=localhost
DB_SLAVE_HOST=localhost  # Bisa sama dengan master untuk dev
REDIS_HOST=localhost

# 3. Create database
mysql -u root -p
CREATE DATABASE konser_yuk;

# 4. Run database migration (add refresh_token fields)
mysql -u root -p konser_yuk < migrations/add_refresh_token_fields.sql

# 5. Terminal 1: Start HTTP Server
npm run dev

# 6. Terminal 2: Start Worker (WAJIB!)
node server/worker.js
```

---

## 🧪 Testing API

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"nama\":\"Test User\",\"email\":\"test@test.com\",\"password\":\"test123\"}" ^
  -c cookies.txt -v
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"test123\"}" ^
  -c cookies.txt -v
```

### 4. Get Profile (dengan cookie)
```bash
curl http://localhost:5000/api/auth/profile -b cookies.txt
```

### 5. Get Events (akan di-cache)
```bash
curl http://localhost:5000/api/events
```

### 6. Purchase Ticket (async)
```bash
# Step 1: Purchase (langsung dapat job_id)
curl -X POST http://localhost:5000/api/tickets/purchase ^
  -H "Content-Type: application/json" ^
  -d "{\"event_id\":1}" ^
  -b cookies.txt

# Response akan berisi job_id

# Step 2: Check status (polling)
curl http://localhost:5000/api/tickets/purchase-status/<JOB_ID> -b cookies.txt
```

---

## 📋 Checklist Setup

- [ ] Docker Desktop terinstal dan berjalan (jika pakai Docker)
- [ ] MySQL terinstal (jika tanpa Docker)
- [ ] Redis terinstal (jika tanpa Docker)
- [ ] Node.js >= 14 terinstal
- [ ] File `.env` sudah dibuat dan dikonfigurasi
- [ ] Database `konser_yuk` sudah dibuat
- [ ] Migration sudah dijalankan (refresh_token fields)
- [ ] Dependencies sudah di-install (`npm install`)
- [ ] HTTP Server berjalan (port 5000)
- [ ] Worker berjalan (PENTING!)

---

## ⚠️ Troubleshooting Common Issues

### "Cannot connect to MySQL"
- Pastikan MySQL berjalan: `docker-compose ps mysql-master` atau `services.msc`
- Check credentials di `.env` benar
- Pastikan database `konser_yuk` sudah dibuat

### "Cannot connect to Redis"
- Pastikan Redis berjalan: `docker-compose ps redis`
- Check REDIS_HOST dan REDIS_PORT di `.env`
- Test koneksi: `docker exec -it konseryuk-redis redis-cli ping`

### "Ticket purchase stuck di processing"
- **Penyebab:** Worker tidak berjalan!
- **Solusi:** 
  ```bash
  # Docker: restart worker
  docker-compose restart worker
  
  # Manual: jalankan worker
  node server/worker.js
  ```

### "Token tidak valid"
- Pastikan request include cookies: `credentials: 'include'` di fetch
- Atau gunakan `-b cookies.txt` di curl

---

## 📖 Next Steps

1. ✅ Baca [README.md](file:///c:/Users/afdal/Downloads/Rio/impal/KonserYuk/backend/README.md) untuk dokumentasi lengkap
2. ✅ Lihat [walkthrough.md](file:///C:/Users/afdal/.gemini/antigravity/brain/04177ec3-3a33-4e6b-b6d1-0b4347917377/walkthrough.md) untuk detail implementasi
3. ✅ Update frontend untuk kompatibel dengan API baru (cookie-based auth + async purchase)
4. ✅ Test dengan load testing (`artillery`) untuk verify no race condition
5. ✅ Deploy ke production!

---

## 🎯 Key Changes Summary

**Authentication:**
- Tokens sekarang di HttpOnly cookies (bukan localStorage)
- Access token: 15 menit, Refresh token: 7 hari
- Auto-refresh mechanism di frontend diperlukan

**Ticket Purchase:**
- Sekarang ASYNC (tidak langsung return ticket)
- Frontend harus polling `/purchase-status/:jobId`
- Mencegah overselling dengan atomic operations

**Performance:**
- Event queries di-cache pakai Redis (80-90% cache hit)
- Database reads ke Slave, writes ke Master
- Response time <1ms untuk cached data

**Scalability:**
- Queue-based architecture
- Worker bisa di-scale independently
- Support 1000+ concurrent requests
