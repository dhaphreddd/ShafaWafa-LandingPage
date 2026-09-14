import React, { useState, useEffect } from 'react';
import { createDonation, getAllPaymentMethods, getAllCostCenters, auth } from '../firebase';

export default function MemberDonations() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [form, setForm] = useState({ amount: '', paymentMethod: '', costCenter: '', proofImage: null, notes: '' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      setPaymentMethods(await getAllPaymentMethods());
      setCostCenters(await getAllCostCenters());
      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return alert('Silakan login terlebih dahulu');
    setSending(true);
    try {
      await createDonation({
        userId: auth.currentUser.uid,
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        costCenter: form.costCenter,
        notes: form.notes,
      });
      alert('Donasi berhasil dikirim! Silakan upload bukti transfer ke admin jika diperlukan.');
      setForm({ amount: '', paymentMethod: '', costCenter: '', proofImage: null, notes: '' });
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim donasi');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="text-white text-center py-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green-mid to-black p-6 text-white">
      <div className="max-w-lg mx-auto bg-green-dark/60 border border-gold/20 rounded-2xl p-8">
        <h1 className="text-2xl font-playfair font-bold mb-6 text-center">Kirim Donasi</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nominal Donasi (Rp)</label>
            <input type="number" required value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm" placeholder="100000" />
          </div>

          {paymentMethods.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Metode Pembayaran</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({...form, paymentMethod: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm">
                <option value="">Pilih Metode</option>
                {paymentMethods.map(pm => <option key={pm.id} value={pm.name}>{pm.name} - {pm.accountNumber}</option>)}
              </select>
            </div>
          )}

          {costCenters.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Pusat Biaya</label>
              <select value={form.costCenter} onChange={(e) => setForm({...form, costCenter: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm">
                <option value="">Umum</option>
                {costCenters.map(cc => <option key={cc.id} value={cc.name}>{cc.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Catatan (Opsional)</label>
            <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm" placeholder="Catatan donasi..."></textarea>
          </div>

          <button type="submit" disabled={sending} className="w-full py-3 bg-gold text-green-dark font-bold rounded-xl">
            {sending ? 'Mengirim...' : 'KIRIM DONASI'}
          </button>
        </form>
      </div>
    </div>
  );
}
