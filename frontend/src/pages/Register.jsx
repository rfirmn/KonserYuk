// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { toast } from 'react-toastify';

// const Register = () => {
//   const [formData, setFormData] = useState({
//     nama: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const { register } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (formData.password !== formData.confirmPassword) {
//       toast.error('Password tidak cocok!');
//       return;
//     }

//     setLoading(true);
//     const result = await register({
//       nama: formData.nama,
//       email: formData.email,
//       password: formData.password
//     });

//     if (result.success) {
//       toast.success('Registrasi berhasil!');
//       navigate('/');
//     } else {
//       toast.error(result.message);
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bbo-yellow via-bbo-orange to-bbo-red p-4">
//       <div className="w-full max-w-md">
//         <div className="bg-white rounded-2xl shadow-2xl p-8">
//           <div className="text-center mb-8">
//             <h1 className="text-4xl font-bold text-bbo-red font-poppins mb-2">
//               Daftar Akun
//             </h1>
//             <p className="text-gray-600">Buat akun BBO Event Anda</p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Nama Lengkap
//               </label>
//               <input
//                 type="text"
//                 required
//                 value={formData.nama}
//                 onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange focus:border-transparent"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 required
//                 value={formData.email}
//                 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange focus:border-transparent"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Password
//               </label>
//               <input
//                 type="password"
//                 required
//                 value={formData.password}
//                 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange focus:border-transparent"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Konfirmasi Password
//               </label>
//               <input
//                 type="password"
//                 required
//                 value={formData.confirmPassword}
//                 onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange focus:border-transparent"
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-gradient-to-r from-bbo-orange to-bbo-red text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
//             >
//               {loading ? 'Loading...' : 'Daftar'}
//             </button>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-gray-600">
//               Sudah punya akun?{' '}
//               <Link to="/login" className="text-bbo-orange font-semibold hover:underline">
//                 Login
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi 1: Cek kecocokan password
    if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak cocok!');
      return;
    }

    // --- TAMBAHAN DI SINI ---
    // Validasi 2: Cek panjang password
    if (formData.password.length < 6) {
      toast.error('Password minimal harus 6 karakter!');
      return;
    }
    // --- AKHIR TAMBAHAN ---

    setLoading(true);
    const result = await register({
      nama: formData.nama,
      email: formData.email,
      password: formData.password
    });

    if (result.success) {
      toast.success('Registrasi berhasil!');
      navigate('/');
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bbo-yellow via-bbo-orange to-bbo-red p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-bbo-red font-poppins mb-2">
              Daftar Akun
            </h1>
            <p className="text-gray-600">Buat akun Konser-yuk Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6} // <-- TAMBAHAN ATRIBUT HTML
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password
              </label>
              <input
                type="password"
                required
                minLength={6} // <-- (Opsional tapi bagus untuk konsistensi)
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bbo-orange focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-bbo-orange to-bbo-red text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Daftar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-bbo-orange font-semibold hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;