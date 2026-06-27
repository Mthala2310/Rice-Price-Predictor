import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

interface Province { id: number; province_name: string; accuracy: number; }
interface DataPoint { month: number; year: number; price: number; label: string; ts: number; }

const COLORS = ['#10b981', '#3b82f6', '#f97316'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function fmtPrice(p: number) { return `Rp${p.toLocaleString('id-ID')}`; }

export default function Comparison() {
  const now = new Date();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(2016);
  const [endMonth, setEndMonth] = useState(now.getMonth() + 1);
  const [endYear, setEndYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [allData, setAllData] = useState<Map<string, DataPoint[]>>(new Map());
  const [labels, setLabels] = useState<string[]>([]);
  const [results, setResults] = useState<{ prov: string; price: number; change: number | null; acc: number }[]>([]);

  useEffect(() => {
    axios.get<Province[]>('/api/provinces').then((r) => setProvinces(r.data)).catch(() => setError('Gagal muat'));
  }, []);

  const toggle = (name: string) => {
    setWarning('');
    if (selected.includes(name)) { setSelected(selected.filter((p) => p !== name)); return; }
    if (selected.length >= 3) { setWarning('Maksimal 3 provinsi'); return; }
    setSelected([...selected, name]);
  };

  const compare = async () => {
    if (selected.length < 2) { setWarning('Pilih minimal 2 provinsi'); return; }
    if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
      setWarning('Tanggal "Dari" harus sebelum "Sampai"'); return;
    }
    setChartLoading(true); setError(''); setWarning('');
    const allLabs = new Set<string>();
    const dataMap = new Map<string, DataPoint[]>();
    const res: typeof results = [];

    try {
      for (const prov of selected) {
        const r = await axios.get<{ province: string; data: { month: number; year: number; price: number }[] }>(
          '/api/historical', { params: { province: prov, start_year: startYear, start_month: startMonth, end_year: endYear, end_month: endMonth } }
        );
        const pts = r.data.data.map((d) => ({ ...d, label: `${monthNames[d.month - 1]} ${d.year}`, ts: d.year * 12 + d.month }));
        dataMap.set(prov, pts);
        if (pts.length === 0) {
          res.push({ prov, price: 0, change: null, acc: 0 });
          continue;
        }
        pts.forEach((p) => allLabs.add(p.label));
        const last = pts[pts.length - 1];
        const prev = pts.length > 1 ? pts[pts.length - 2] : null;
        const ch = prev && prev.price > 0 ? ((last.price - prev.price) / prev.price * 100) : null;
        const province = provinces.find((p) => p.province_name === prov);
        res.push({ prov, price: last.price, change: ch, acc: province?.accuracy ?? 0 });
      }
      setResults(res);
      setAllData(dataMap);
      setLabels(Array.from(allLabs));
    } catch { setError('Gagal memuat data'); }
    setChartLoading(false);
  };

  const chartData = labels.map((label) => {
    const point: Record<string, string | number | null> = { label };
    for (const prov of selected) {
      const data = allData.get(prov) || [];
      const match = data.find((d) => d.label === label);
      point[prov] = match?.price ?? null;
    }
    return point;
  });

  return (
    <AuthenticatedLayout>
      <Head title="Komparasi" />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Analisis Komparasi</h1>
        </div>
        <p className="text-white/40 text-sm">Bandingkan harga beras antar provinsi (maks. 3)</p>
      </div>

      {error && (
        <div className="mb-6 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Controls */}
      <div className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-white/40 mb-2">Pilih Provinsi</label>
            <div className="flex flex-wrap gap-2">
              {provinces.map((p) => {
                const sel = selected.includes(p.province_name);
                return (
                  <button key={p.id} onClick={() => toggle(p.province_name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      sel ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white/70'
                    }`}
                  >
                    {sel && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {p.province_name}
                  </button>
                );
              })}
            </div>
            {warning && <p className="text-amber-400 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{warning}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Dari Bulan</label>
            <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))} className="w-28 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm appearance-none">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{monthNames[m - 1]}</option>)}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-white/40 mb-1.5">Dari Tahun</label>
            <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm appearance-none">
              {Array.from({ length: 15 }, (_, i) => 2016 + i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Sampai Bulan</label>
            <select value={endMonth} onChange={(e) => setEndMonth(Number(e.target.value))} className="w-28 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm appearance-none">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{monthNames[m - 1]}</option>)}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-white/40 mb-1.5">Sampai Tahun</label>
            <select value={endYear} onChange={(e) => setEndYear(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm appearance-none">
              {Array.from({ length: 15 }, (_, i) => 2016 + i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={compare} disabled={selected.length < 2 || chartLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-600/30 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:hover:scale-100"
          >
            {chartLoading ? 'Memuat...' : 'Bandingkan'}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-8 p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
        <h3 className="text-sm font-semibold text-white/70 mb-4">Grafik Perbandingan</h3>
        {chartLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-10 h-10 border-4 border-white/5 rounded-full" />
              <div className="absolute inset-0 w-10 h-10 border-4 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          </div>
        ) : selected.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <BarChart3 className="w-10 h-10 mb-2" />
            <p className="text-sm">Pilih minimal 2 provinsi</p>
          </div>
        ) : (
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} width={55} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                      <p className="text-xs text-white/50 mb-2">{label}</p>
                      {payload.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm py-0.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                          <span className="text-white/70">{e.name}:</span>
                          <span className="font-semibold text-white">{fmtPrice(e.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                {selected.map((prov, i) => (
                  <Line key={prov} type="monotone" dataKey={prov} stroke={COLORS[i]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls name={prov} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Table */}
      {results.length > 0 && (
        <div className="rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white/70">Ringkasan Perbandingan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Provinsi</th>
                  <th className="text-right px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Harga</th>
                  <th className="text-right px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Perubahan</th>
                  <th className="text-right px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Akurasi</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.prov} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors" style={{ animationDelay: `${i * 80}ms` }}>
                    <td className="px-5 py-4 text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      {r.prov}
                    </td>
                    <td className="px-5 py-4 text-white text-right font-semibold">{fmtPrice(r.price)}</td>
                    <td className="px-5 py-4 text-right">
                      {r.change !== null ? (
                        <span className={`inline-flex items-center gap-1 text-sm ${r.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {r.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {Math.abs(r.change).toFixed(1)}%
                        </span>
                      ) : <span className="text-white/30">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-emerald-400 text-sm font-medium">{r.acc}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
