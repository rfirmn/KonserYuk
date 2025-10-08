// server.js
// Contoh implementasi PSPEC -> kode (Node.js + Express)
// Run: npm init -y
//      npm i express body-parser uuid qrcode
//      node server.js

const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");

const app = express();
app.use(bodyParser.json());

// ----------------------
// In-memory "database"
// ----------------------
const concerts = [];      // tb_konser
const vouchers = [];      // tb_voucher
const transactions = [];  // tb_transaksi (final)
const tempOrders = [];    // tb_transaksi_temp
const etickets = [];      // tb_eticket
const users = [];         // tb_user (sederhana)

// seed data sederhana
(function seed() {
  concerts.push({
    id: "c1",
    title: "RioFest 2025",
    date: "2025-12-20",
    location: "Stadion Merdeka",
    categories: [
      { code: "VIP", price: 500000, capacity: 50 },
      { code: "REG", price: 150000, capacity: 500 }
    ],
    image: "",
    description: "Konser musik tahunan terbesar."
  });

  vouchers.push({
    code: "R10OFF",
    type: "percent", // percent | nominal
    value: 10,       // 10%
    expiry: "2025-12-31",
    active: true,
    singleUse: false
  });

  users.push({ id: "u1", name: "Rio", email: "rio@example.com" });
})();

// ----------------------
// Util helpers
// ----------------------
function findConcert(concertId) {
  return concerts.find(c => c.id === concertId);
}

function findVoucher(code) {
  return vouchers.find(v => v.code === code && v.active);
}

function calculatePrice(concert, categoryCode, qty) {
  const cat = concert.categories.find(c => c.code === categoryCode);
  if (!cat) throw new Error("Kategori tidak ditemukan");
  return cat.price * qty;
}

// ----------------------
// PSPEC -> Endpoints
// ----------------------

// 1. Lihat daftar konser (Process: Melihat Daftar Konser)
app.get("/concerts", (req, res) => {
  // optional filter query: ?q=Rio
  const q = (req.query.q || "").toLowerCase();
  const list = concerts.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  res.json({ data: list });
});

// 2. Lihat detail konser (Process: Melihat Detail Konser)
app.get("/concerts/:id", (req, res) => {
  const c = findConcert(req.params.id);
  if (!c) return res.status(404).json({ error: "Konser tidak ditemukan" });
  res.json({ data: c });
});


// ----------------------
// Start server
// ----------------------
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
    res.send("<h2>Selamat datang di API Tiket Konser 🎟️</h2><p>Coba akses <a href='/concerts'>/concerts</a> untuk melihat daftar konser.</p>");
  });

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
