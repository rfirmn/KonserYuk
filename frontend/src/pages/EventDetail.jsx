import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.data);
    } catch (error) {
      toast.error('Gagal memuat detail event');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-bbo-orange border-t-transparent"></div>
        </div>
      </>
    );
  }

  if (!event) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-96 bg-gradient-to-br from-bbo-yellow via-bbo-orange to-bbo-red flex items-center justify-center">
            {event.poster_url ? (
              <img
                src={event.poster_url}
                alt={event.nama}
                className="w-full h-full object-cover"
              />
            ) : (
              <h1 className="text-5xl font-bold text-white text-center px-4">
                {event.nama}
              </h1>
            )}
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    {event.nama}
                  </h1>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {event.deskripsi || 'Deskripsi event akan segera hadir.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <svg className="w-6 h-6 text-bbo-orange mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-gray-800">Lokasi</h3>
                      <p className="text-gray-600">{event.lokasi}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <svg className="w-6 h-6 text-bbo-orange mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-gray-800">Tanggal & Waktu</h3>
                      <p className="text-gray-600">{formatDate(event.tanggal)}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <svg className="w-6 h-6 text-bbo-orange mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-gray-800">Kuota Tersedia</h3>
                      <p className="text-gray-600">{event.kuota} tiket tersisa</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-1">
                <div className="bg-gradient-to-br from-bbo-yellow via-bbo-orange to-bbo-red p-6 rounded-2xl text-white sticky top-4">
                  <h3 className="text-2xl font-bold mb-4">Pesan Tiket</h3>
                  
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6">
                    <p className="text-sm mb-1">Harga Tiket</p>
                    <p className="text-3xl font-bold">{formatPrice(event.harga)}</p>
                  </div>

                  <Link
                    to={`/checkout/${event.id}`}
                    className="block w-full bg-white text-bbo-red text-center py-3 rounded-lg font-semibold hover:bg-opacity-90 transition"
                  >
                    Beli Sekarang
                  </Link>

                  <Link
                    to="/"
                    className="block w-full text-center mt-3 text-white hover:underline"
                  >
                    Kembali ke Beranda
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;