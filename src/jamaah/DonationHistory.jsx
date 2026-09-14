import React, { useState, useEffect } from 'react';
import { getLiveCollection, auth } from '../firebase';

export default function MemberDonationHistory() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getLiveCollection('donations', 'submittedAt', 'desc');
      setDonations(data.filter(d => d.userId === auth.currentUser?.uid));
      setLoading(false);
    }
    load();
  }, []);

  const getStatus = (s) => ({
    pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', label: 'Pending Verifikasi' },
    verified: { color: 'bg-green-500/20 text-green-400 border-green-500/40', label: 'Terverifikasi' },
    rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/40', label: 'Ditolak' },
  })[s] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/40', label: s };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green-mid to-black p-6 text-white">
      <h1 className="text-3xl font-playfair font-bold mb-6 text-center">Riwayat Donasi</h1>
      {loading ? <p className="text-center">Memuat...</p> : donations.length === 0 ? (
        <p className="text-center text-gray-400">Belum ada donasi</p>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {donations.map(d => {
            const st = getStatus(d.status);
            return (
              <div key={d.id} className="bg-green-dark/60 border border-gold/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Rp {Number(d.amount).toLocaleString('id-ID')}</p>
                  <p className="text-xs text-gray-400">Metode: {d.paymentMethod || '-'}</p>
                  <p className="text-xs text-gray-400">Tgl: {new Date(d.submittedAt).toLocaleDateString('id-ID')}</p>
                </div>
                <span className={`text-xs border px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
