import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { TrendingUp } from 'lucide-react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4 sm:px-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.08),transparent_70%)]" />

            <div className="relative z-10 w-full max-w-md">
                <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">RicePrice</span>
                </Link>

                <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-8 sm:px-8 shadow-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
