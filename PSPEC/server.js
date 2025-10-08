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

// 3. Pembelian tiket (Process: Pembelian Tiket)
// Buat pesanan sementara (transaksi temp)
app.post("/orders", (req, res) => {
  const { userId, concertId, category, quantity } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ error: "User tidak ditemukan" });

  const concert = findConcert(concertId);
  if (!concert) return res.status(400).json({ error: "Konser tidak ditemukan" });

  const cat = concert.categories.find(c => c.code === category);
  if (!cat) return res.status(400).json({ error: "Kategori tidak ditemukan" });
  if (cat.capacity < quantity) return res.status(400).json({ error: "Kapasitas tidak mencukupi" });

  const total = calculatePrice(concert, category, quantity);

  const order = {
    id: uuidv4(),
    userId,
    concertId,
    category,
    quantity,
    total,
    createdAt: new Date().toISOString()
  };

  tempOrders.push(order);
  res.json({ message: "Pesanan sementara dibuat", order });
});

// 4. Penerapan kode voucher (Process: Penerapan Kode Voucher)
app.post("/apply-voucher", (req, res) => {
  const { orderId, code } = req.body;
  const order = tempOrders.find(o => o.id === orderId);
  if (!order) return res.status(400).json({ error: "Order tidak ditemukan" });

  const v = findVoucher(code);
  if (!v) return res.status(400).json({ error: "Voucher tidak valid atau tidak aktif" });

  // cek expiry
  const now = new Date();
  if (new Date(v.expiry) < now) return res.status(400).json({ error: "Voucher kedaluwarsa" });

  let discount = 0;
  if (v.type === "percent") discount = Math.round(order.total * (v.value / 100));
  else if (v.type === "nominal") discount = v.value;

  const newTotal = Math.max(0, order.total - discount);
  order.voucher = { code: v.code, discount, type: v.type };
  order.totalAfterVoucher = newTotal;

  res.json({ message: "Voucher diterapkan", order });
});

// 5. Pembayaran tiket (Process: Pembayaran Tiket)
// Simulasi: menerima payment_method, "memanggil" payment gateway mock
app.post("/payments", (req, res) => {
    const { orderId, payment_method } = req.body;
    const orderIndex = tempOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return res.status(400).json({ error: "Order tidak ditemukan" });
  
    const order = tempOrders[orderIndex];
    // total final (bila ada voucher)
    const finalTotal = order.totalAfterVoucher ?? order.total;
  
    // Simulasi: kirim ke payment gateway (mock)
    // Kita akan anggap sukses jika payment_method terisi
    if (!payment_method) return res.status(400).json({ error: "Metode pembayaran harus diisi" });
  
    // Mock response dari payment gateway
    const paymentStatus = "SUCCESS"; // atau "FAILED" untuk simulasi error
    const transactionId = uuidv4();
  
    if (paymentStatus === "SUCCESS") {
      // Simpan ke transaksi final
      const trx = {
        id: transactionId,
        orderId: order.id,
        userId: order.userId,
        concertId: order.concertId,
        category: order.category,
        quantity: order.quantity,
        amount: finalTotal,
        payment_method,
        status: "PAID",
        createdAt: new Date().toISOString()
      };
      transactions.push(trx);
  
      // Kurangi kapasitas
      const concert = findConcert(order.concertId);
      const cat = concert.categories.find(c => c.code === order.category);
      cat.capacity -= order.quantity;
  
      // Hapus order temp
      tempOrders.splice(orderIndex, 1);
  
      // Generate e-ticket (QR)
      const eticketId = uuidv4();
      const qrData = JSON.stringify({ eticketId, transactionId, userId: trx.userId });
      QRCode.toDataURL(qrData)
        .then(qrImage => {
          const et = {
            id: eticketId,
            transactionId,
            userId: trx.userId,
            concertId: trx.concertId,
            category: trx.category,
            quantity: trx.quantity,
            qr: qrImage,
            status: "ACTIVE",
            createdAt: new Date().toISOString()
          };
          etickets.push(et);
          res.json({ message: "Pembayaran sukses", transaction: trx, eticket: et });
        })
        .catch(err => {
          // walau QR gagal, transaksi telah tercatat
          res.status(500).json({ error: "Gagal generate QR", err: err.message });
        });
    } else {
      res.status(400).json({ message: "Pembayaran gagal" });
    }
  });
  
  // 6. Melihat daftar tiket saya (Process: Melihat Daftar Tiket)
  app.get("/my-tickets/:userId", (req, res) => {
    const userId = req.params.userId;
    const list = etickets.filter(e => e.userId === userId);
    res.json({ data: list });
  });
  
// 7. Lihat e-ticket (by eticket id)
app.get("/etickets/:id", (req, res) => {
  const e = etickets.find(x => x.id === req.params.id);
  if (!e) return res.status(404).json({ error: "E-ticket tidak ditemukan" });
  res.json({ data: e });
});

// 8. Validasi tiket (Admin memindai QR) (Process: Validasi Tiket)
app.post("/admin/validate", (req, res) => {
  // input: eticketId
  const { eticketId } = req.body;
  const et = etickets.find(x => x.id === eticketId);
  if (!et) return res.status(404).json({ error: "E-ticket tidak ditemukan" });

  if (et.status !== "ACTIVE") return res.status(400).json({ error: "Tiket sudah digunakan atau tidak aktif" });

  // mark as used
  et.status = "USED";
  et.usedAt = new Date().toISOString();

  res.json({ message: "Tiket valid - akses diperbolehkan", et });
});

// 9. Admin: CRUD konser (Process: Pengelolaan Data Konser)
app.post("/admin/concerts", (req, res) => {
  const { title, date, location, categories, description } = req.body;
  const id = uuidv4();
  concerts.push({ id, title, date, location, categories, description });
  res.json({ message: "Konser ditambahkan", id });
});

app.put("/admin/concerts/:id", (req, res) => {
  const i = concerts.findIndex(c => c.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: "Konser tidak ditemukan" });
  Object.assign(concerts[i], req.body);
  res.json({ message: "Konser diperbarui", concert: concerts[i] });
});

app.delete("/admin/concerts/:id", (req, res) => {
  const i = concerts.findIndex(c => c.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: "Konser tidak ditemukan" });
  concerts.splice(i, 1);
  res.json({ message: "Konser dihapus" });
});

// 10. Admin: Manajemen voucher (Process: Manajemen Voucher)
app.post("/admin/vouchers", (req, res) => {
  const { code, type, value, expiry, active } = req.body;
  vouchers.push({ code, type, value, expiry, active: active ?? true });
  res.json({ message: "Voucher ditambahkan", code });
});

app.put("/admin/vouchers/:code", (req, res) => {
  const i = vouchers.findIndex(v => v.code === req.params.code);
  if (i === -1) return res.status(404).json({ error: "Voucher tidak ditemukan" });
  Object.assign(vouchers[i], req.body);
  res.json({ message: "Voucher diperbarui", voucher: vouchers[i] });
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
