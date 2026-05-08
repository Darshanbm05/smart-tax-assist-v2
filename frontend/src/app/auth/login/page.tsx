'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      router.push('/expenses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 md:space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            SmartTax Assist
          </h2>
          <p className="mt-2 text-sm md:text-base text-slate-400">
            Sign in to your account to continue
          </p>
        </div>

        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 md:p-4">
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-3 md:space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-surface-card border border-surface-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm md:text-base"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-surface-card border border-surface-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm md:text-base"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 md:py-2.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 active:scale-95 text-sm md:text-base"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center">
            <p className="text-xs md:text-sm text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}