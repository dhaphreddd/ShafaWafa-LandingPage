import React, { useState, useEffect } from 'react';
import { getAllEvents, registerForEvent } from '../firebase';
import { auth } from '../firebase';

export default function MemberEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getAllEvents();
      setEvents(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleRegister = async (eventId) => {
    if (!auth.currentUser) return alert('Silakan login terlebih dahulu');
    try {
      await registerForEvent(auth.currentUser.uid, eventId, { notes: 'Pendaftaran mandiri jamaah' });
      alert('Pendaftaran berhasil dikirim! Menunggu persetujuan pengurus.');
    } catch (err) {
      console.error(err);
      alert('Gagal mendaftar kegiatan');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green-mid to-black p-6 text-white">
      <h1 className="text-3xl font-playfair font-bold mb-6 text-center">Daftar Kegiatan</h1>
      {loading ? <p className="text-center">Memuat...</p> : (
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {events.map(ev => (
            <div key={ev.id} className="bg-green-dark/60 border border-gold/20 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-playfair text-xl font-bold text-gold mb-2">{ev.title}</h3>
                <p className="text-xs text-gray-300 mb-4">{ev.description}</p>
                <p className="text-xs text-gray-400 mb-4"><i className="fas fa-calendar me-1"></i> {ev.startDate}</p>
              </div>
              <button onClick={() => handleRegister(ev.id)} className="w-full py-2 bg-gold text-green-dark font-bold rounded-lg text-sm">Daftar Kegiatan</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
