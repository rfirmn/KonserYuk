import React from 'react';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="h-48 bg-gradient-to-br from-bbo-yellow to-bbo-red flex items-center justify-center overflow-hidden">
        {event.poster_url ? (
          <img
            src={event.poster_url}
            alt={event.nama}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white text-center p-6">
            <h3 className="text-2xl font-bold">{event.nama}</h3>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
          {event.nama}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2 text-bbo-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{event.lokasi}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2 text-bbo-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">{formatDate(event.tanggal)}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2 text-bbo-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-semibold text-bbo-red">{formatPrice(event.harga)}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2 text-bbo-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm">Kuota: {event.kuota} tiket</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link
            to={`/events/${event.id}`}
            className="flex-1 text-center px-4 py-2 border-2 border-bbo-orange text-bbo-orange rounded-lg hover:bg-bbo-orange hover:text-white transition"
          >
            Detail
          </Link>
          <Link
            to={`/checkout/${event.id}`}
            className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-bbo-orange to-bbo-red text-white rounded-lg hover:shadow-lg transition"
          >
            Beli Tiket
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;