import React, { useState, useEffect } from 'react';
import { getLiveCollection, auth } from '../firebase';

export default function MemberMyEvents() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getLiveCollection('eventRegistrations', 'registeredAt', 'desc');
      const myRegs = data.filter(r => r.userId === auth.currentUser?.uid);
      setRegistrations(myRegs);
      setLoading(false);
    }
    load();
  }, []);

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
      approved: 'bg-green-500/20 text-green-400 border-green-500/40',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/40',
      attended: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    };
    const labels = {
      pending: 'Menunggu Approval',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      attended: 'Selesai',
    };
    return <span className={`text-xs border px-3 py-1 rounded-full ${colors[status] || colors.pending}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green-mid to-black p-6 text-white">
      <h1 className="text-3xl font-playfair font-bold mb-6 text-center">Kegiatan Saya</h1>
      {loading ? <p className="text-center">Memuat...</p> : registrations.length === 0 ? (
        <p className="text-center text-gray-400">Belum ada pendaftaran kegiatan</p>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {registrations.map(reg => (
            <div key={reg.id} className="bg-green-dark/60 border border-gold/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{reg.eventId}</p>
                <p className="text-xs text-gray-400">Terdaftar: {new Date(reg.registeredAt).toLocaleDateString('id-ID')}</p>
              </div>
              {getStatusBadge(reg.status)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
