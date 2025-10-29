import React from 'react';

const LoadingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bbo-yellow via-bbo-orange to-bbo-red">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-white/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold text-white font-poppins">
          Tunggu Sebentar
        </h2>
        <p className="text-white/90 mt-2">Kami Akan Menyiapkan Semuanya</p>
      </div>
    </div>
  );
};

export default LoadingPage;