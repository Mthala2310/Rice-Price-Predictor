import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded bg-slate-800 border-white/20 text-emerald-500 shadow-sm focus:ring-emerald-500/30 focus:ring-offset-slate-900 ' +
                className
            }
        />
    );
}
