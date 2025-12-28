import React, { useState, useEffect, useCallback } from 'react'; // 1. Tambah useCallback
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { QRCodeSVG } from 'qrcode.react';

const History = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // 2. Gunakan useCallback agar fungsi ini stabil dan tidak bikin infinite loop
  const fetchHistory = useCallback(async () => {
    // Safety check: jika user belum ada, stop.
    if (!user || !user.id) return;

    try {
      setLoading(true);
      // 3. Tambahkan query '?t=...' untuk mencegah caching browser (Data selalu baru)
      const response = await api.get(`/users/${user.id}/history?t=${new Date().getTime()}`);
      setTickets(response.data.data || []);
    } catch (error) {
      console.error(error);
      if (user) toast.error('Gagal memuat riwayat pembelian');
    } finally {
      setLoading(false);
    }
  }, [user]); // Dependency fungsi ini adalah user

  // 4. Masukkan fetchHistory ke dependency array
  useEffect(() => {
    if (user && user.id) {
      fetchHistory();
    }
  }, [user, fetchHistory]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (!user && loading) return <div>Loading User...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Riwayat Pembelian</h1>
          {/* 5. Tombol Refresh Manual (Opsional tapi sangat berguna) */}
          <button
            onClick={fetchHistory}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh Data ↻
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading data...</div>
        ) : tickets.length > 0 ? (
          <div className="grid gap-6">
            {tickets.map((ticket) => {
              // 6. Safety Access: Menangani kemungkinan huruf besar/kecil dari backend
              const eventData = ticket.Event || ticket.event || {};
              const tanggalBeli = ticket.waktu_beli || ticket.createdAt;

              return (
                <div key={ticket.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {eventData.nama || 'Event Tidak Ditemukan'}
                      </h3>
                      <div className="space-y-1 text-gray-600">
                        <p><span className="font-semibold">Lokasi:</span> {eventData.lokasi || '-'}</p>
                        <p>
                          <span className="font-semibold">Tanggal Beli:</span>{' '}
                          {tanggalBeli ? new Date(tanggalBeli).toLocaleDateString('id-ID') : '-'}
                        </p>
                        <p><span className="font-semibold">Total:</span> {formatPrice(ticket.total_harga)}</p>
                        <p>
                          <span className="font-semibold">Status:</span>{' '}
                          <span className={`px-3 py-1 rounded-full text-sm ${ticket.status === 'aktif' ? 'bg-green-100 text-green-800' :
                              ticket.status === 'digunakan' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {ticket.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition"
                    >
                      Lihat QR
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600 text-lg">Belum ada riwayat pembelian</p>
          </div>
        )}
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-xl p-8 max-w-md w-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              E-Ticket
            </h3>
            <div className="text-center mb-6">
              <QRCodeSVG value={selectedTicket.kode_qr} size={200} className="mx-auto" />
              <p className="text-sm text-gray-600 mt-4 font-mono bg-gray-100 p-2 rounded">
                {selectedTicket.kode_qr}
              </p>
            </div>
            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;