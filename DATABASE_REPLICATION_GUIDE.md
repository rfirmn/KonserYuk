# 🎫 Panduan Replikasi Database - Konser Yuk

Dokumen ini berisi langkah-langkah konfigurasi replikasi MySQL Master-Slave untuk sistem tiket *high-traffic* Konser Yuk menggunakan Docker.

## 🏗️ Arsitektur Infrastruktur

* **MySQL Master (`port 3306`):** Menangani operasi **Write** (INSERT, UPDATE, DELETE). Digunakan saat registrasi user atau pembelian tiket.
* **MySQL Slave (`port 3307` eksternal / `3306` internal):** Menangani operasi **Read** (SELECT). Digunakan untuk menampilkan daftar event dan login.
* **Redis:** Digunakan untuk caching dan antrean pesan (BullMQ).

---

## 🔐 1. Persiapan Kredensial (`.env`)

Pastikan file `.env` di root dan folder backend memiliki konfigurasi berikut agar sinkron dengan Docker:

```env
DB_NAME=konser_yuk
DB_USER=konseruser
DB_PASSWORD=konserpassword
DB_MASTER_HOST=mysql-master
DB_SLAVE_HOST=mysql-slave
DB_PORT=3306

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redispassword

```

---

## 🚀 2. Langkah Inisialisasi Replikasi

### A. Konfigurasi User Replikasi di Master

Langkah ini memberikan izin kepada Slave untuk mengakses log data dari Master menggunakan metode autentikasi yang kompatibel (non-SSL).

1. Masuk ke terminal Master:
`docker exec -it konseryuk-mysql-master mysql -u root -prootpassword`
2. Jalankan perintah SQL:
```sql
CREATE USER 'replicator'@'%' IDENTIFIED WITH mysql_native_password BY 'replicatorpass';
GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';
FLUSH PRIVILEGES;
SHOW MASTER STATUS;

```


*Catat nilai **File** (misal: mysql-bin.000003) dan **Position** (misal: 4097).*

### B. Menghubungkan Slave ke Master

Langkah ini memerintahkan Slave untuk mulai memantau log dari Master.

1. Masuk ke terminal Slave:
`docker exec -it konseryuk-mysql-slave mysql -u root -prootpassword`
2. Jalankan perintah SQL:
```sql
STOP REPLICA;
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST='mysql-master',
  SOURCE_USER='replicator',
  SOURCE_PASSWORD='replicatorpass',
  SOURCE_LOG_FILE='[NAMA_FILE_LOG]', -- Sesuaikan
  SOURCE_LOG_POS=[ANGKA_POSISI],      -- Sesuaikan
  GET_SOURCE_PUBLIC_KEY=1;
START REPLICA;

```



---

## 🔄 3. Sinkronisasi Data Awal (Snapshot)

Karena Slave tidak otomatis menyalin tabel yang sudah dibuat sebelum koneksi terjalin, jalankan perintah *pipe* ini di terminal WSL:

```bash
docker exec konseryuk-mysql-master mysqldump -u root -prootpassword konser_yuk | docker exec -i konseryuk-mysql-slave mysql -u root -prootpassword konser_yuk

```

---

## ✅ 4. Cara Verifikasi

Untuk memastikan replikasi berjalan selamanya, cek status di Slave:
`SHOW REPLICA STATUS\G`

**Status Sehat:**

* `Replica_IO_Running: Yes`
* `Replica_SQL_Running: Yes`
* `Seconds_Behind_Source: 0`

---

## 🛠️ Troubleshooting Umum

* **Error: Table doesn't exist:** Biasanya karena sinkronisasi awal (Langkah 3) belum dijalankan, atau Slave terputus (`Connecting`).
* **Error: Access Denied for root:** Pastikan backend menggunakan `DB_USER=konseruser` dan bukan `root`.
* **Error: Exec format error (bcrypt):** Hapus folder `node_modules` di Windows host, lalu jalankan `docker-compose up --build`.

---

**Next Step:**
Kamu bisa menyimpan teks di atas ke file `.md`. Apakah kamu ingin saya buatkan juga satu script `.sh` sederhana agar semua perintah manual di atas bisa dijalankan hanya dengan satu kali klik di masa depan?