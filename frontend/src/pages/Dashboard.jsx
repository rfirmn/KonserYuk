import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTickets: 0,
    totalRevenue: 0
  });
  const [qrCode, setQrCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Voucher states
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [voucherForm, setVoucherForm] = useState({
    id: null,
    kode: '',
    diskon: '',
    aktif_dari: '',
    aktif_sampai: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const eventsResponse = await api.get('/events');
      setStats(prev => ({
        ...prev,
        totalEvents: eventsResponse.data.data?.length || 0
      }));
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleValidateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    setValidationResult(null);

    try {
      const response = await api.get(`/tickets/validate/${qrCode}`);
      setValidationResult({
        success: true,
        data: response.data.data,
        message: 'Tiket valid!'
      });
      toast.success('Tiket berhasil divalidasi');
      setQrCode('');
    } catch (error) {
      setValidationResult({
        success: false,
        message: error.response?.data?.message || 'Tiket tidak valid'
      });
      toast.error(error.response?.data?.message || 'Tiket tidak valid');
    } finally {
      setLoading(false);
    }
  };

  // Voucher functions
  const fetchVouchers = async () => {
    setLoadingVouchers(true);
    try {
      const response = await api.get('/vouchers');
      setVouchers(response.data.data || []);
    } catch (error) {
      toast.error('Gagal memuat voucher');
      console.error('Fetch vouchers error:', error);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const openVoucherModal = () => {
    setShowVoucherModal(true);
    fetchVouchers();
  };

  const closeVoucherModal = () => {
    setShowVoucherModal(false);
    resetVoucherForm();
  };

  const resetVoucherForm = () => {
    setVoucherForm({
      id: null,
      kode: '',
      diskon: '',
      aktif_dari: '',
      aktif_sampai: ''
    });
    setIsEditMode(false);
  };

  const handleVoucherFormChange = (e) => {
    const { name, value } = e.target;
    setVoucherForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vouchers', {
        kode: voucherForm.kode,
        diskon: parseFloat(voucherForm.diskon),
        aktif_dari: voucherForm.aktif_dari,
        aktif_sampai: voucherForm.aktif_sampai
      });
      toast.success('Voucher berhasil ditambahkan');
      resetVoucherForm();
      fetchVouchers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menambahkan voucher');
    }
  };

  const handleEditVoucher = (voucher) => {
    setVoucherForm({
      id: voucher.id,
      kode: voucher.kode,
      diskon: voucher.diskon,
      aktif_dari: voucher.aktif_dari.split('T')[0],
      aktif_sampai: voucher.aktif_sampai.split('T')[0]
    });
    setIsEditMode(true);
  };

  const handleUpdateVoucher = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/vouchers/${voucherForm.id}`, {
        kode: voucherForm.kode,
        diskon: parseFloat(voucherForm.diskon),
        aktif_dari: voucherForm.aktif_dari,
        aktif_sampai: voucherForm.aktif_sampai
      });
      toast.success('Voucher berhasil diupdate');
      resetVoucherForm();
      fetchVouchers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengupdate voucher');
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus voucher ini?')) {
      return;
    }

    try {
      await api.delete(`/vouchers/${id}`);
      toast.success('Voucher berhasil dihapus');
      fetchVouchers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus voucher');
    }
  };

  const isVoucherActive = (voucher) => {
    const now = new Date();
    const aktifDari = new Date(voucher.aktif_dari);
    const aktifSampai = new Date(voucher.aktif_sampai);
    return now >= aktifDari && now <= aktifSampai;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Admin</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">Total Events</p>
                <p className="text-3xl font-bold">{stats.totalEvents}</p>
              </div>
              <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-1">Total Tiket Terjual</p>
                <p className="text-3xl font-bold">{stats.totalTickets}</p>
              </div>
              <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-bbo-orange to-bbo-red text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 mb-1">Total Pendapatan</p>
                <p className="text-3xl font-bold">Rp {stats.totalRevenue.toLocaleString('id-ID')}</p>
              </div>
              <svg className="w-12 h-12 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Link
                to="/admin/events"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-bbo-orange to-bbo-red text-white rounded-lg hover:shadow-lg transition"
              >
                <span className="font-semibold">Kelola Events</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <button
                onClick={openVoucherModal}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
              >
                <span className="font-semibold">Kelola Vouchers</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => toast.info('Fitur laporan akan segera hadir')}
                className="w-full flex items-center justify-between p-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <span className="font-semibold">Lihat Laporan</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Validasi Tiket</h2>

            <form onSubmit={handleValidateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode QR Tiket
                </label>
                <input
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Masukkan kode QR"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-bbo-orange to-bbo-red text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Memvalidasi...' : 'Validasi Tiket'}
              </button>
            </form>

            {validationResult && (
              <div className={`mt-6 p-4 rounded-lg ${validationResult.success
                ? 'bg-green-50 border-2 border-green-500'
                : 'bg-red-50 border-2 border-red-500'
                }`}>
                <div className="flex items-start">
                  {validationResult.success ? (
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${validationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {validationResult.message}
                    </p>
                    {validationResult.success && validationResult.data && (
                      <div className="mt-2 text-sm text-gray-700">
                        <p><strong>Event:</strong> {validationResult.data.Event?.nama}</p>
                        <p><strong>Pembeli:</strong> {validationResult.data.User?.nama}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Kelola Voucher</h2>
              <button
                onClick={closeVoucherModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Voucher Form */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {isEditMode ? 'Edit Voucher' : 'Tambah Voucher Baru'}
                </h3>
                <form onSubmit={isEditMode ? handleUpdateVoucher : handleCreateVoucher} className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kode Voucher
                    </label>
                    <input
                      type="text"
                      name="kode"
                      value={voucherForm.kode}
                      onChange={handleVoucherFormChange}
                      placeholder="Contoh: DISC20"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diskon (Rp)
                    </label>
                    <input
                      type="number"
                      name="diskon"
                      value={voucherForm.diskon}
                      onChange={handleVoucherFormChange}
                      placeholder="20000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aktif Dari
                    </label>
                    <input
                      type="date"
                      name="aktif_dari"
                      value={voucherForm.aktif_dari}
                      onChange={handleVoucherFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aktif Sampai
                    </label>
                    <input
                      type="date"
                      name="aktif_sampai"
                      value={voucherForm.aktif_sampai}
                      onChange={handleVoucherFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
                    >
                      {isEditMode ? 'Update Voucher' : 'Tambah Voucher'}
                    </button>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={resetVoucherForm}
                        className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Voucher List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Daftar Voucher</h3>
                {loadingVouchers ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : vouchers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Belum ada voucher</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Kode</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Diskon</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aktif Dari</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aktif Sampai</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {vouchers.map((voucher) => (
                          <tr key={voucher.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{voucher.kode}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{Number(voucher.diskon)}%</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{formatDate(voucher.aktif_dari)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{formatDate(voucher.aktif_sampai)}</td>
                            <td className="px-4 py-3 text-sm">
                              {isVoucherActive(voucher) ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                  Aktif
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                  Tidak Aktif
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditVoucher(voucher)}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteVoucher(voucher.id)}
                                  className="text-red-600 hover:text-red-800 font-medium"
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;