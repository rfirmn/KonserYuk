import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';

const Checkout = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data.data);
    } catch (error) {
      toast.error('Gagal memuat event');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const response = await api.post('/tickets/purchase', {
        event_id: eventId,
        voucher_code: voucherCode || undefined
      });

      toast.success('Tiket berhasil dibeli! Silakan lakukan pembayaran.');
      
      if (response.data.data.payment?.redirect_url) {
        window.location.href = response.data.data.payment.redirect_url;
      } else {
        navigate('/history');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membeli tiket');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="text-center py-12">Loading...</div>
      </>
    );
  }

  if (!event) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const totalPrice = parseFloat(event.harga) - discount;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Detail Event</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-700"><span className="font-semibold">Event:</span> {event.nama}</p>
                <p className="text-gray-700"><span className="font-semibold">Lokasi:</span> {event.lokasi}</p>
                <p className="text-gray-700"><span className="font-semibold">Tanggal:</span> {new Date(event.tanggal).toLocaleDateString('id-ID')}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Informasi Pembeli</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-700"><span className="font-semibold">Nama:</span> {user.nama}</p>
                <p className="text-gray-700"><span className="font-semibold">Email:</span> {user.email}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Kode Voucher (Opsional)</h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Masukkan kode voucher"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange"
                />
                <button
                  onClick={() => toast.info('Fitur voucher akan segera tersedia')}
                  className="px-6 py-2 bg-bbo-orange text-white rounded-lg hover:bg-opacity-90"
                >
                  Terapkan
                </button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Ringkasan Pembayaran</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga Tiket</span>
                  <span className="font-semibold">{formatPrice(event.harga)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-bbo-red">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="w-full bg-gradient-to-r from-bbo-orange to-bbo-red text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {purchasing ? 'Memproses...' : 'Bayar Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;