import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getUserProfile } from '../utils/roleHelper';

export default function MemberDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth) {
      navigate('/jamaah/login');
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const prof = await getUserProfile(user.uid);
        setProfile(prof);
      } else {
        navigate('/jamaah/login');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/jamaah/login');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-dark via-green-mid to-black flex items-center justify-center text-white">
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin fa-2xl mb-3 text-gold" />
          <p className="text-sm">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green-mid to-black text-white">
      {/* Header */}
      <div className="bg-green-dark/80 backdrop-blur-md border-b border-gold/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i className="fas fa-tachometer-alt text-gold text-xl" />
            <h1 className="font-playfair text-xl font-bold">Dashboard Jamaah</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <i className="fas fa-sign-out-alt" />
            Keluar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-green-dark/60 backdrop-blur-md border border-gold/20 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <i className="fas fa-user text-gold text-3xl" />
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-playfair text-2xl font-bold">{profile?.name || user?.displayName || 'Jamaah'}</h2>
              <p className="text-gold-light text-sm">{profile?.email || user?.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <span className="text-xs bg-green-500/20 border border-green-500/40 px-3 py-1 rounded-full">
                  {profile?.role === 'member' ? 'Anggota' : profile?.role || 'Member'}
                </span>
                {user?.emailVerified ? (
                  <span className="text-xs bg-blue-500/20 border border-blue-500/40 px-3 py-1 rounded-full flex items-center gap-1">
                    <i className="fas fa-check-circle" /> Email Terverifikasi
                  </span>
                ) : (
                  <span className="text-xs bg-yellow-500/20 border border-yellow-500/40 px-3 py-1 rounded-full flex items-center gap-1">
                    <i className="fas fa-exclamation-circle" /> Email Belum Diverifikasi
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/jamaah/profile"
            className="bg-green-dark/60 backdrop-blur-md border border-gold/20 rounded-xl p-6 hover:bg-green-dark/80 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center group-hover:bg-gold/30 transition">
                <i className="fas fa-user-edit text-gold text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Profil Saya</h3>
                <p className="text-xs text-gray-400">Edit informasi pribadi</p>
              </div>
            </div>
          </Link>

          <Link
            to="/jamaah/events"
            className="bg-green-dark/60 backdrop-blur-md border border-gold/20 rounded-xl p-6 hover:bg-green-dark/80 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition">
                <i className="fas fa-calendar-alt text-blue-400 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Kegiatan</h3>
                <p className="text-xs text-gray-400">Daftar kegiatan tersedia</p>
              </div>
            </div>
          </Link>

          <Link
            to="/jamaah/my-events"
            className="bg-green-dark/60 backdrop-blur-md border border-gold/20 rounded-xl p-6 hover:bg-green-dark/80 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition">
                <i className="fas fa-list-check text-purple-400 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Kegiatan Saya</h3>
                <p className="text-xs text-gray-400">Riwayat pendaftaran</p>
              </div>
            </div>
          </Link>

          <Link
            to="/jamaah/donations"
            className="bg-green-dark/60 backdrop-blur-md border border-gold/20 rounded-xl p-6 hover:bg-green-dark/80 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition">
                <i className="fas fa-hand-holding-heart text-green-400 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Donasi</h3>
                <p className="text-xs text-gray-400">Kirim donasi baru</p>
              </div>
            </div>
          </Link>

          <Link
            to="/jamaah/donation-history"
            className="bg-green-dark/60 backdrop-blur-md border border-gold/20 rounded-xl p-6 hover:bg-green-dark/80 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/30 transition">
                <i className="fas fa-history text-yellow-400 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Riwayat Donasi</h3>
                <p className="text-xs text-gray-400">Lihat riwayat kontribusi</p>
              </div>
            </div>
          </Link>

          <Link
            to="/"
            className="bg-green-dark/60 backdrop-blur-md border border-gold/20 rounded-xl p-6 hover:bg-green-dark/80 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center group-hover:bg-gray-500/30 transition">
                <i className="fas fa-home text-gray-400 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Beranda</h3>
                <p className="text-xs text-gray-400">Kembali ke landing page</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
