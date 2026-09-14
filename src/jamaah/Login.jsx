import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getUserProfile } from '../utils/roleHelper';
import { formatImageUrl } from '../utils/imageHelper';

export default function MemberLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase Auth belum terkonfigurasi');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const profile = await getUserProfile(user.uid);

      if (profile && profile.status === 'inactive') {
        setError('Akun Anda dinonaktifkan oleh admin. Silakan hubungi pengurus.');
        setLoading(false);
        return;
      }

      navigate('/jamaah/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('Email atau password salah. Silakan coba lagi.');
      } else {
        setError('Gagal masuk. Periksa koneksi internet Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Masukkan email Anda untuk instruksi reset password.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Instruksi reset password telah dikirim ke email Anda.');
    } catch (err) {
      console.error(err);
      setError('Gagal mengirim email reset password. Pastikan email terdaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green-mid to-black flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-green-dark/80 backdrop-blur-md p-8 rounded-2xl border border-gold/20 shadow-2xl">
        <div className="text-center mb-6">
          <img
            src={formatImageUrl('logo-sm.webp')}
            alt="Logo Yayasan"
            className="w-20 h-20 mx-auto mb-3 rounded-full border-2 border-gold shadow-lg"
          />
          <h1 className="font-playfair text-2xl font-bold text-white mb-1">Portal Jamaah</h1>
          <p className="text-gold-light text-xs font-inter">Yayasan Pesantren Ahlus-Shafa Wal-Wafa</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
            <i className="fas fa-exclamation-circle text-sm" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
            <i className="fas fa-check-circle text-sm" />
            <span>{message}</span>
          </div>
        )}

        {!isResetMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email Jamaah</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jamaah@shafawafa.or.id"
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold text-white"
                />
                <i className="far fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gold text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold text-white"
                />
                <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gold text-sm" />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => setIsResetMode(true)}
                className="text-gold-light hover:underline"
              >
                Lupa Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-gold to-gold-light text-green-dark font-bold text-sm rounded-xl shadow-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'MASUK SEKARANG'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Masukkan Email Terdaftar</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jamaah@shafawafa.or.id"
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold text-white"
                />
                <i className="far fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gold text-sm" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-gold to-gold-light text-green-dark font-bold text-sm rounded-xl shadow-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Kirim...' : 'KIRIM INSTRUKSI RESET'}
            </button>

            <button
              type="button"
              onClick={() => setIsResetMode(false)}
              className="w-full text-center text-xs text-gray-400 hover:text-white"
            >
              &larr; Kembali ke Login
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-white/10 text-center space-y-2 text-xs">
          <p className="text-gray-400">
            Belum punya akun jamaah?{' '}
            <Link to="/jamaah/register" className="text-gold-light font-semibold hover:underline">
              Daftar Jamaah Baru
            </Link>
          </p>
          <p>
            <Link to="/" className="text-gray-400 hover:text-white flex items-center justify-center gap-1">
              <i className="fas fa-arrow-left text-xs" /> Kembali ke Landing Page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
