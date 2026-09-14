import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, storage, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { upsertUserProfile, getUserProfile } from '../utils/roleHelper';
import { formatImageUrl } from '../utils/imageHelper';

export default function MemberProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const prof = await getUserProfile(user.uid);
        setProfile(prof);
        setFormData({ name: prof?.name || user.displayName || '', phone: prof?.phone || '', address: prof?.address || '' });
      } else {
        navigate('/jamaah/login');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let photoURL = profile?.photoURL;
      if (photo) {
        const photoRef = ref(storage, `jamaah/${auth.currentUser.uid}/profile.jpg`);
        await uploadBytesResumable(photoRef, photo);
        photoURL = await getDownloadURL(photoRef);
        await updateProfile(auth.currentUser, { photoURL });
      }
      await upsertUserProfile(auth.currentUser.uid, { ...formData, photoURL });
      alert('Profil berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      alert('Gagal update profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white text-center py-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green-mid to-black p-4 text-white">
      <div className="max-w-xl mx-auto bg-green-dark/60 p-8 rounded-2xl border border-gold/20">
        <h2 className="text-2xl font-playfair font-bold mb-6">Profil Saya</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-6">
            <img src={formData.photoURL || profile?.photoURL || formatImageUrl('default-user.png')} className="w-24 h-24 rounded-full mx-auto mb-2 object-cover border-2 border-gold" />
            <input type="file" onChange={(e) => setPhoto(e.target.files[0])} className="text-xs text-gray-400" />
          </div>
          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm" placeholder="Nama Lengkap" />
          <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm" placeholder="Nomor HP/WA" />
          <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm" placeholder="Alamat Lengkap" />
          <button type="submit" disabled={saving} className="w-full py-3 bg-gold text-green-dark font-bold rounded-xl">{saving ? 'Menyimpan...' : 'Simpan Profil'}</button>
        </form>
      </div>
    </div>
  );
}
