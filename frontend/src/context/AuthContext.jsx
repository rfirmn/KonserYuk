import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback, // <--- 1. Import useCallback
} from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // 2. Stabilkan 'logout' agar tidak dibuat ulang setiap render
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []); // Dependensi kosong karena setter (setUser, setToken) stabil

  // 3. Stabilkan 'loadUser' dan tambahkan 'logout' sebagai dependensinya
  const loadUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data.data);
    } catch (error) {
      console.error('Load user error:', error);
      logout(); // Memanggil 'logout' yang sudah stabil
    } finally {
      setLoading(false);
    }
  }, [logout]); // <-- Dependensi ke 'logout'

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token, loadUser]); // <--- 4. Tambahkan 'loadUser' ke dependency array

  // 5. (Opsional tapi bagus) Stabilkan 'login' dan 'register'
  // Ini mencegah re-render yang tidak perlu pada komponen anak
  // yang menggunakan fungsi-fungsi ini.
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login gagal',
      };
    }
  }, []); // Dependensi kosong (setter stabil)

  const register = useCallback(async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registrasi gagal',
      };
    }
  }, []); // Dependensi kosong (setter stabil)

  // Nilai 'value' sekarang berisi fungsi-fungsi yang stabil
  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};