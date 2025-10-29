import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    lokasi: '',
    tanggal: '',
    harga: '',
    deskripsi: '',
    kuota: '',
    poster_url: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.data);
    } catch (error) {
      toast.error('Gagal memuat events');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        nama: event.nama,
        lokasi: event.lokasi,
        tanggal: event.tanggal.split('T')[0],
        harga: event.harga,
        deskripsi: event.deskripsi || '',
        kuota: event.kuota,
        poster_url: event.poster_url || ''
      });
    } else {
      setEditingEvent(null);
      setFormData({
        nama: '',
        lokasi: '',
        tanggal: '',
        harga: '',
        deskripsi: '',
        kuota: '',
        poster_url: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, formData);
        toast.success('Event berhasil diupdate');
      } else {
        await api.post('/events', formData);
        toast.success('Event berhasil ditambahkan');
      }
      
      handleCloseModal();
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan event');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus event ini?')) {
      try {
        await api.delete(`/events/${id}`);
        toast.success('Event berhasil dihapus');
        fetchEvents();
      } catch (error) {
        toast.error('Gagal menghapus event');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Kelola Events</h1>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-gradient-to-r from-bbo-orange to-bbo-red text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            + Tambah Event
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama Event</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Lokasi</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Harga</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Kuota</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">{event.nama}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{event.lokasi}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(event.tanggal).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Rp {parseFloat(event.harga).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{event.kuota}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenModal(event)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
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
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingEvent ? 'Edit Event' : 'Tambah Event Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Event</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi</label>
                <input
                  type="text"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Harga</label>
                  <input
                    type="number"
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kuota</label>
                  <input
                    type="number"
                    value={formData.kuota}
                    onChange={(e) => setFormData({ ...formData, kuota: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange"
                  rows="4"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Poster</label>
                <input
                  type="url"
                  value={formData.poster_url}
                  onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange"
                  placeholder="https://example.com/poster.jpg"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-bbo-orange to-bbo-red text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  {editingEvent ? 'Update Event' : 'Tambah Event'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;