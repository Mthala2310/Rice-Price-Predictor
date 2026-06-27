import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Search, Wheat, Calendar } from 'lucide-react';

interface Province { id: number; province_name: string; accuracy: number; }
interface DataPoint { month: number; year: number; price: number; }
interface HistoricalResponse { province: string; data: DataPoint[]; }
interface PredictionResponse { province: string; month: number; year: number; predicted_price: number; accuracy: number; source: string; }

interface ChartPoint { label: string; month: number; year: number; price?: number; predicted?: number; isPrediction?: boolean; ts: number; }

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const monthFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatPrice(p: number) { return `Rp${p.toLocaleString('id-ID')}`; }
function fmt(n: number) { return monthNames[n - 1] + ' ' + n; }

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-white/5 rounded-full" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    </div>
  );
}

export default function Prediction() {
  const now = new Date();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [prov, setProv] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get<Province[]>('/api/provinces').then((r) => {
      setProvinces(r.data);
      if (r.data.length > 0) setProv(r.data[0].province_name);
    }).catch(() => setError('Gagal muat provinsi')).then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!prov) return;
    setChartLoading(true);
    setResult(null);
    const params: Record<string, string | number> = { province: prov, limit: 24 };
    if (year <= now.getFullYear()) params.year = year;
    axios.get<HistoricalResponse>('/api/historical', { params })
      .then((r) => {
        setChart(r.data.data.map((d) => ({
          label: monthNames[d.month - 1] + ' ' + d.year,
          month: d.month, year: d.year, price: d.price, ts: d.year * 12 + d.month,
        })));
      }).catch(() => setError('Gagal muat data')).then(() => setChartLoading(false));
  }, [prov, year]);

  const predict = async () => {
    setPredicting(true); setError('');
    try {
      const r = await axios.post<PredictionResponse>('/api/predict', { province: prov, month, year });
      setResult(r.data);
      const prev = [...chart].reverse().find((d) => d.ts < r.data.year * 12 + r.data.month);
      setPrevPrice(prev?.price ?? null);

      const isF = r.data.year > now.getFullYear() || (r.data.year === now.getFullYear() && r.data.month > now.getMonth() + 1);
      if (isF) {
        setChart((prev) => {
          const exists = prev.find((d) => d.month === r.data.month && d.year === r.data.year);
          if (exists) return prev.map((d) => d.month === r.data.month && d.year === r.data.year ? { ...d, predicted: r.data.predicted_price, isPrediction: true } : d);
          const np: ChartPoint = { label: monthNames[r.data.month - 1] + ' ' + r.data.year, month: r.data.month, year: r.data.year, predicted: r.data.predicted_price, isPrediction: true, ts: r.data.year * 12 + r.data.month };
          return [...prev, np].sort((a, b) => a.ts - b.ts);
        });
      }
    } catch { setError('Gagal prediksi. Coba lagi.'); } finally { setPredicting(false); }
  };

  const change = result && prevPrice ? result.predicted_price - prevPrice : null;
  const isFuture = result && (result.year > now.getFullYear() || (result.year === now.getFullYear() && result.month > now.getMonth() + 1));

  return (
    <AuthenticatedLayout>
      <Head title="Prediksi" />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Wheat className="w-6 h-6 text-emerald-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Prediksi Harga</h1>
        </div>
        <p className="text-white/40 text-sm">Analisis satu provinsi — data historis + prediksi AI</p>
      </div>

      {error && (
        <div className="mb-6 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
          <TrendingDown className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-white/40 mb-1.5">Provinsi</label>
          <select value={prov} onChange={(e) => setProv(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all appearance-none">
            {provinces.map((p) => <option key={p.id} value={p.province_name}>{p.province_name}</option>)}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-xs text-white/40 mb-1.5">Bulan</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all appearance-none">
            {monthFull.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="w-28">
          <label className="block text-xs text-white/40 mb-1.5">Tahun</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all appearance-none">
            {Array.from({ length: 15 }, (_, i) => 2016 + i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={predict} disabled={predicting || !prov}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-600/30 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:hover:scale-100 flex items-center gap-2"
          >
            {predicting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses</>
            ) : (
              <><Search className="w-4 h-4" /> Prediksi</>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-teal-500/10 border border-emerald-500/30 relative overflow-hidden animate-fade-in">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-emerald-300/60 text-xs uppercase tracking-wider font-medium mb-1">Hasil Prediksi</p>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">{formatPrice(result.predicted_price)}</h2>
                <p className="text-emerald-200/50 text-sm mt-1">{monthFull[result.month - 1]} {result.year} — {result.province}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {change !== null && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-md ${change >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/20 text-red-300 border border-red-500/20'}`}>
                    {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {formatPrice(Math.abs(change))}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md bg-white/5 text-white/60 border border-white/10">
                  Akurasi {result.accuracy}%
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md border ${isFuture ? 'bg-amber-500/20 text-amber-300 border-amber-500/20' : 'bg-blue-500/20 text-blue-300 border-blue-500/20'}`}>
                  {isFuture ? 'Prediksi AI' : 'Riwayat'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Grafik Tren Harga {prov && <span className="text-white/40 font-normal">— {prov}</span>}
          </h3>
          {chart.length > 0 && (
            <span className="text-xs text-white/30">{chart.length} bulan</span>
          )}
        </div>
        {chartLoading ? <LoadingSpinner /> : chart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <Wheat className="w-10 h-10 mb-2" />
            <p className="text-sm">Pilih provinsi untuk grafik</p>
          </div>
        ) : (
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} width={55} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                      <p className="text-xs text-white/50 mb-2">{label}</p>
                      {payload.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                          <span className="text-white/70">{e.name}:</span>
                          <span className="font-semibold text-white">{formatPrice(e.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }} />
                <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }} connectNulls name="Harga" />
                <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 4, fill: '#f59e0b', stroke: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#f59e0b', stroke: '#0f172a', strokeWidth: 2 }} connectNulls name="Prediksi" />
                {result && isFuture && <ReferenceLine x={chart.find((d) => d.isPrediction)?.label} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
