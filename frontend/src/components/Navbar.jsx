import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-bbo-orange to-bbo-red bg-clip-text text-transparent">
            Konser-yuk
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-bbo-orange transition">
              Beranda
            </Link>

            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Link to="/admin/dashboard" className="text-gray-700 hover:text-bbo-orange transition">
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/history" className="text-gray-700 hover:text-bbo-orange transition">
                    Riwayat
                  </Link>
                )}
                
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700">{user.nama}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-bbo-red text-white rounded-lg hover:bg-opacity-90 transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-gradient-to-r from-bbo-orange to-bbo-red text-white rounded-lg hover:shadow-lg transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;