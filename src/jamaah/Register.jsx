import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { setDoc, doc } from 'firebase/firestore';
import { getUserProfile } from '../utils/roleHelper';

export default function MemberRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && ['image/jpeg', 'image/png'].includes(file.type)) {
      setPhoto(file);
    } else {
      setError('Format gambar harus JPG/PNG');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (!auth) {
      setError('Firebase Auth belum terkonfigurasi');
      return;
    }
    setLoading(true);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCred.user;

      // Update profile
      await updateProfile(user, { displayName: formData.name, photoURL: null });

      // Send email verification
      await sendEmailVerification(user);

      // Upload photo (optional)
      let photoURL = null;
      if (photo) {
        const photoRef = ref(storage, `jamaah/${user.uid}/profile.jpg`);
        const uploadTask = uploadBytesResumable(photoRef, photo);
        await uploadTask;
        photoURL = await getDownloadURL(photoRef);
      }

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        photoURL: photoURL,
        role: 'member',
        status: 'active',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });

      setMessage(
        'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi akun. ' +
        'Setelah email diverifikasi, Anda dapat login dan mengakses fitur jamaah.'
      );
      setFormData({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
      setPhoto(null);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email ini sudah terdaftar. Silakan gunakan email lain atau login.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email tidak valid');
      } else {
        setError('Gagal mendaftar. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green-mid to-black flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-lg bg-green-dark/80 backdrop-blur-md p-8 rounded-2xl border border-gold/20 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="font-playfair text-2xl font-bold text-white mb-1">Daftar Jamaah Baru</h1>
          <p className="text-gold-light text-xs font-inter">
            Isi data lengkap untuk membuat akun jamaah
          </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="Nama lengkap jamaah"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Email Aktif</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="email@domain.com"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nomor HP/WA</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              placeholder="0812-3456-7890"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={handleChange('password')}
              placeholder="Minimal 6 karakter"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Konfirmasi Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              placeholder="Ulangi password"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Foto Profil (Opsional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePhotoChange}
              className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-gold to-gold-light text-green-dark font-bold text-sm rounded-xl shadow-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'DAFTAR AKUN JAMAAH'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs">
          <p className="text-gray-400">
            Sudah punya akun?{' '}
            <Link to="/jamaah/login" className="text-gold-light font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
          <p className="mt-2">
            <Link to="/" className="text-gray-400 hover:text-white flex items-center justify-center gap-1">
              <i className="fas fa-arrow-left text-xs" /> Kembali ke Landing Page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
