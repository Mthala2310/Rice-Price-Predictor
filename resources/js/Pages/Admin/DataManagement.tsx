import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Upload, Download, Plus, Trash2, Pencil, X, Check, FileSpreadsheet } from 'lucide-react';

interface Province { id: number; province_name: string; }
interface Price { id: number; province_id: number; month: number; year: number; price: string; province: Province; }
interface PricesResponse { provinces: Province[]; prices: { data: Price[]; current_page: number; last_page: number; from: number; to: number; total: number; }; }

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function fmtPrice(p: string | number) { return `Rp${Number(p).toLocaleString('id-ID')}`; }

export default function AdminDataManagement() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null);

  // Form
  const [form, setForm] = useState({ province_id: 0, month: new Date().getMonth() + 1, year: new Date().getFullYear(), price: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ province_id: 0, month: 1, year: 2024, price: '' });
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const fetchData = (p: number) => {
    setLoading(true);
    axios.get<PricesResponse>('/api/admin/data', { params: { page: p } })
      .then((r) => {
        setProvinces(r.data.provinces);
        setPrices(r.data.prices.data);
        setPage(r.data.prices.current_page);
        setLastPage(r.data.prices.last_page);
        setTotal(r.data.prices.total);
      }).catch(() => showMsg('Gagal muat data', 'err')).then(() => setLoading(false));
  };

  useEffect(() => { fetchData(1); }, []);

  const showMsg = (m: string, t: 'ok' | 'err') => { setMsg(m); setMsgType(t); setTimeout(() => setMsg(''), 3000); };

  const save = async () => {
    if (!form.province_id || !form.price) return;
    try {
      await axios.post('/api/admin/data', form);
      showMsg('Data tersimpan', 'ok');
      setForm({ ...form, price: '' });
      fetchData(page);
    } catch { showMsg('Gagal simpan', 'err'); }
  };

  const startEdit = (p: Price) => { setEditId(p.id); setEditForm({ province_id: p.province_id, month: p.month, year: p.year, price: p.price }); };
  const cancelEdit = () => { setEditId(null); };

  const saveEdit = async (id: number) => {
    try {
      await axios.put(`/api/admin/data/${id}`, editForm);
      showMsg('Data diupdate', 'ok');
      setEditId(null);
      fetchData(page);
    } catch { showMsg('Gagal update', 'err'); }
  };

  const deletePrice = async (id: number) => {
    if (!confirm('Hapus data ini?')) return;
    try {
      await axios.delete(`/api/admin/data/${id}`);
      showMsg('Data dihapus', 'ok');
      fetchData(page);
    } catch { showMsg('Gagal hapus', 'err'); }
  };

  const importCsv = async () => {
    if (!csvFile) return;
    const fd = new FormData();
    fd.append('csv', csvFile);
    try {
      const r = await axios.post<{ count: number; errors: string[]; message: string }>('/api/admin/data/import', fd);
      setImportResult({ count: r.data.count, errors: r.data.errors });
      showMsg(`Import: ${r.data.count} records`, 'ok');
      fetchData(1);
      setCsvFile(null);
    } catch { showMsg('Gagal import CSV', 'err'); }
  };

  const downloadTemplate = () => { window.open('/api/admin/data/template', '_blank'); };

  return (
    <AuthenticatedLayout>
      <Head title="Data" />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Database className="w-6 h-6 text-emerald-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Manajemen Data</h1>
        </div>
        <p className="text-white/40 text-sm">Kelola data harga beras historis</p>
      </div>

      {msg && (
        <div className={`mb-6 px-5 py-3 rounded-xl text-sm flex items-center gap-2 ${
          msgType === 'ok' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'
        }`}>
          {msgType === 'ok' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Add form */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" /> Tambah Data
          </h3>
          <div className="space-y-3">
            <select value={form.province_id} onChange={(e) => setForm({ ...form, province_id: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm appearance-none">
              <option value={0} className="text-white/40">Pilih Provinsi</option>
              {provinces.map((p) => <option key={p.id} value={p.id}>{p.province_name}</option>)}
            </select>
            <div className="flex gap-2">
              <select value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })} className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm appearance-none">
                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm appearance-none">
                {Array.from({ length: 15 }, (_, i) => 2016 + i).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">Rp</span>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="12000" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all" />
            </div>
            <button onClick={save} disabled={!form.province_id || !form.price}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-600/30 transition-all disabled:opacity-40"
            >Simpan</button>
          </div>
        </div>

        {/* CSV Import */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" /> Import CSV
          </h3>
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-500/30 cursor-pointer transition-all bg-slate-800/30">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="text-sm text-white/50">{csvFile ? csvFile.name : 'Klik untuk upload CSV'}</span>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
            </label>
            <div className="flex gap-2">
              <button onClick={importCsv} disabled={!csvFile}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-600/30 transition-all disabled:opacity-40"
              ><Upload className="w-4 h-4 inline mr-1" /> Upload</button>
              <button onClick={downloadTemplate}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm font-medium hover:bg-slate-700/80 transition-all"
              ><Download className="w-4 h-4 inline mr-1" /> Template</button>
            </div>
            {importResult && (
              <div className="text-xs text-white/40">
                <span className="text-emerald-400">{importResult.count} records</span> diimport
                {importResult.errors.length > 0 && <div className="text-red-300 mt-1">{importResult.errors.slice(0, 3).join(', ')}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/70">Data Historis ({total})</h3>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => fetchData(page - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 hover:text-white/70 transition-all disabled:opacity-30">Prev</button>
            <span className="text-xs text-white/30">{page} / {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => fetchData(page + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 hover:text-white/70 transition-all disabled:opacity-30">Next</button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-white/5 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Provinsi</th>
                  <th className="text-left px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Periode</th>
                  <th className="text-right px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Harga</th>
                  <th className="text-right px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    {editId === p.id ? (
                      <>
                        <td className="px-5 py-3 text-white/40">{p.id}</td>
                        <td className="px-5 py-3">
                          <select value={editForm.province_id} onChange={(e) => setEditForm({ ...editForm, province_id: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white text-xs appearance-none">
                            {provinces.map((pr) => <option key={pr.id} value={pr.id}>{pr.province_name}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1">
                            <select value={editForm.month} onChange={(e) => setEditForm({ ...editForm, month: Number(e.target.value) })}
                              className="flex-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white text-xs appearance-none">
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: Number(e.target.value) })}
                              className="flex-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white text-xs appearance-none">
                              {Array.from({ length: 15 }, (_, i) => 2016 + i).map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white text-xs text-right" />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => saveEdit(p.id)} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4 text-white/40">{p.id}</td>
                        <td className="px-5 py-4 text-white">{p.province.province_name}</td>
                        <td className="px-5 py-4 text-white/70">{monthNames[p.month - 1]} {p.year}</td>
                        <td className="px-5 py-4 text-white text-right font-medium">{fmtPrice(p.price)}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/20 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deletePrice(p.id)} className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {prices.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-white/30">Belum ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
