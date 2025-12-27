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
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

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

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Masukkan kode voucher terlebih dahulu');
      return;
    }

    setApplyingVoucher(true);
    try {
      const response = await api.get(`/vouchers/validate/${voucherCode}`);
      const voucher = response.data.data;

      setAppliedVoucher(voucher);
      const discountAmount = (event.harga * parseFloat(voucher.diskon)) / 100;
      setDiscount(discountAmount);
      toast.success(`Voucher ${voucher.kode} berhasil diterapkan! Diskon Rp ${discountAmount.toLocaleString('id-ID')}`);
    } catch (error) {
      setAppliedVoucher(null);
      setDiscount(0);
      toast.error(error.response?.data?.message || 'Voucher tidak valid');
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscount(0);
    setVoucherCode('');
    toast.info('Voucher dihapus');
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const response = await api.post('/tickets/purchase', {
        event_id: eventId,
        voucher_code: appliedVoucher?.kode || undefined
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

  // const totalPrice = event.harga - (event.harga * Number(appliedVoucher.diskon) / 100);
  const totalPrice = event.harga - discount;
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

              {appliedVoucher ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-green-800">Voucher {appliedVoucher.kode} diterapkan</p>
                        <p className="text-sm text-green-700">Diskon: {Number(appliedVoucher.diskon)}%</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveVoucher}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode voucher"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange"
                  />
                  <button
                    onClick={handleApplyVoucher}
                    disabled={applyingVoucher}
                    className="px-6 py-2 bg-bbo-orange text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                  >
                    {applyingVoucher ? 'Cek...' : 'Terapkan'}
                  </button>
                </div>
              )}
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
                    <span>Diskon ({appliedVoucher?.kode})</span>
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