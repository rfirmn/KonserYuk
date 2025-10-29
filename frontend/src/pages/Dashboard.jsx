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
                onClick={() => toast.info('Fitur voucher akan segera hadir')}
                className="w-full flex items-center justify-between p-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
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
              <div className={`mt-6 p-4 rounded-lg ${
                validationResult.success 
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
    </div>
  );
};

export default Dashboard;