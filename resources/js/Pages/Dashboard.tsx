import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, ArrowRight, Wheat, Map } from 'lucide-react';

interface CardData {
  id: number;
  province_name: string;
  latest_price: number | null;
  latest_month: number | null;
  latest_year: number | null;
  change_percent: number | null;
  accuracy: number;
  source?: string;
}

interface DashboardResponse {
  cards: CardData[];
  all_provinces: CardData[];
}

const gradients = [
  'from-emerald-500/20 to-teal-500/10 border-emerald-500/20',
  'from-sky-500/20 to-blue-500/10 border-sky-500/20',
  'from-violet-500/20 to-purple-500/10 border-violet-500/20',
  'from-amber-500/20 to-orange-500/10 border-amber-500/20',
  'from-rose-500/20 to-pink-500/10 border-rose-500/20',
  'from-cyan-500/20 to-teal-500/10 border-cyan-500/20',
  'from-lime-500/20 to-green-500/10 border-lime-500/20',
  'from-fuchsia-500/20 to-violet-500/10 border-fuchsia-500/20',
];

const accentColors = [
  'text-emerald-400',
  'text-sky-400',
  'text-violet-400',
  'text-amber-400',
  'text-rose-400',
  'text-cyan-400',
  'text-lime-400',
  'text-fuchsia-400',
];

function formatPrice(price: number | null) {
  if (!price) return '—';
  return `Rp${price.toLocaleString('id-ID')}`;
}

export default function Dashboard() {
  const user = usePage().props.auth.user as { name: string };
  const userName = user.name.split(' ')[0];

  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avg: 0, highest: '', highestPrice: 0 });

  useEffect(() => {
    setLoading(true);
    axios.get<DashboardResponse>('/api/dashboard')
      .then((res) => {
        const data = res.data.cards ?? [];
        setCards(data);
        const prices = data.filter((c) => c.latest_price);
        const avg = prices.length > 0 ? prices.reduce((s, c) => s + (c.latest_price || 0), 0) / prices.length : 0;
        let highest = { name: '', price: 0 };
        for (const c of prices) {
          if ((c.latest_price || 0) > highest.price) {
            highest = { name: c.province_name, price: c.latest_price || 0 };
          }
        }
        setStats({
          total: data.length,
          avg,
          highest: highest.name,
          highestPrice: highest.price,
        });
      })
      .catch(() => {})
      .then(() => setLoading(false));
  }, []);

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Hai, {userName} <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="mt-2 text-white/40 text-sm">Ringkasan harga beras nasional bulan ini</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Map className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Provinsi</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-white/30 mt-1">Seluruh provinsi terpantau</div>
        </div>
        <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Wheat className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Rata-Rata</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatPrice(stats.avg)}</div>
          <div className="text-xs text-white/30 mt-1">Harga rata-rata nasional</div>
        </div>
        <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Tertinggi</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.highest || '—'}</div>
          <div className="text-xs text-white/30 mt-1">{stats.highestPrice ? formatPrice(stats.highestPrice) : ''}</div>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white/80">Harga Beras per Provinsi</h2>
            <span className="text-xs text-white/30">{cards.length} provinsi</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => (
              <div
                key={card.id}
                className={`group relative p-5 rounded-2xl bg-gradient-to-br ${gradients[i % gradients.length]} border hover:scale-[1.02] transition-all duration-300 cursor-default`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                      {card.province_name}
                    </span>
                    {card.source === 'prediction' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300">
                        Prediksi
                      </span>
                    )}
                  </div>
                  {card.change_percent !== null && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${
                        card.change_percent >= 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {card.change_percent >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(card.change_percent).toFixed(1)}%
                    </span>
                  )}
                </div>

                <div className="text-2xl font-bold text-white mb-1">
                  {formatPrice(card.latest_price)}
                </div>
                <div className="text-xs text-white/40 mb-4">
                  {card.latest_month && card.latest_year
                    ? `${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][card.latest_month - 1]} ${card.latest_year}`
                    : '—'}
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${accentColors[i % accentColors.length]}`}>
                    Akurasi {card.accuracy}%
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000"
                      style={{ width: `${card.accuracy}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Ingin prediksi lebih detail?</h3>
          <p className="text-white/40 text-sm mt-1">Lihat grafik tren dan prediksi harga per provinsi</p>
        </div>
        <a
          href="/prediction"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-600/30 transition-all"
        >
          Prediksi
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </AuthenticatedLayout>
  );
}
