'use client'
// components/layout/MobileNav.tsx

import { useState } from 'react'
import { Menu, X, LogOut, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Upload,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react'

const NAV = [
  { href: '/expenses', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload Bill', icon: Upload },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/reports', label: 'Reports', icon: FileSpreadsheet },
]

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const path = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
    setIsOpen(false)
  }

  return (
    <div className="md:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-surface-card border-b border-surface-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">SmartTax</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-slate-400" />
          ) : (
            <Menu className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="fixed inset-0 top-16 bg-black/50 z-40" onClick={() => setIsOpen(false)}>
          <nav className="bg-surface-card border-b border-surface-border max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-2">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = path === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95',
                      active
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-4 h-4" size={18} />
                    {label}
                  </Link>
                )
              })}
            </div>

            {user && (
              <div className="px-4 py-4 border-t border-surface-border space-y-3">
                <div className="text-xs">
                  <p className="text-slate-400">Logged in as</p>
                  <p className="text-white font-medium truncate text-sm mt-1">{user.full_name}</p>
                  <p className="text-slate-500 text-xs truncate">{user.email}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-150 text-sm font-medium active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>

                <p className="text-xs text-slate-500">v1.0.0 · Bills never stored</p>
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
