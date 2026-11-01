/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Target,
  KanbanSquare,
  CalendarCheck2,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Bell,
  Search,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  CalendarCheck,
  WalletCards,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseSetupBanner } from '../common/SupabaseSetupBanner';

const MAIN_NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/north-star', label: 'North Star', icon: Compass },
  { to: '/target-hierarchy', label: 'Target Hierarchy', icon: Target },
  { to: '/execution', label: 'Execution Board', icon: KanbanSquare },
  { to: '/habit-tracker', label: 'Habit Tracker', icon: CalendarCheck },
  { to: '/second-brain', label: 'Second Brain', icon: BrainCircuit },
  { to: '/monthly-review', label: 'Monthly Review', icon: CalendarCheck2 },
  { to: '/ai-prompt', label: 'AI Prompt Generator', icon: Sparkles },
];

const SYSTEM_NAV_ITEMS = [
  { to: '/settings', label: 'Pengaturan', icon: Settings },
];

function getIndonesianGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

export const AppLayout: React.FC = () => {
  const { user, signOut, isConfigured } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const allNav = [...MAIN_NAV_ITEMS, ...SYSTEM_NAV_ITEMS];
  const currentNav = allNav.find((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  );

  const greeting = getIndonesianGreeting();
  const displayName = user?.email?.split('@')[0] || 'Executive User';

  return (
    <div className="min-h-screen bg-[#071B35] text-[#F8FAFC] flex flex-col md:flex-row font-sans selection:bg-[#0EA5E9] selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#061A32] border-b border-[#1E3A5F] sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0EA5E9] to-[#22D3EE] flex items-center justify-center text-white shadow-md shadow-[#0EA5E9]/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
              Life OS Funnel
            </span>
            <span className="text-[10px] text-[#22D3EE] font-mono font-medium block">
              Personal Business OS
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg bg-[#0B2545] border border-[#1E3A5F]"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile drawer */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-[#061A32] border-r border-[#15385F] flex flex-col z-40 transition-transform duration-200 ease-in-out shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Zone */}
        <div className="px-6 py-6 border-b border-[#15385F]/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] via-[#0284C7] to-[#22D3EE] flex items-center justify-center text-white shadow-lg shadow-[#0EA5E9]/30 shrink-0 border border-white/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-base font-extrabold tracking-tight text-white leading-tight flex items-center gap-1.5">
              <span>Life OS Funnel</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#0EA5E9]/20 text-[#22D3EE] border border-[#22D3EE]/30 font-mono font-bold">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-[#94A3B8] font-medium truncate mt-0.5">
              Personal Business Operating System
            </p>
          </div>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">
          {/* Main Menu Group */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]/80 font-mono">
                MAIN MENU
              </span>
            </div>
            <nav className="space-y-1">
              {MAIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white shadow-md shadow-[#0EA5E9]/30 border border-[#22D3EE]/40'
                          : 'text-[#94A3B8] hover:text-white hover:bg-[#0B2545] border border-transparent'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-[#22D3EE]' : 'text-[#94A3B8] group-hover:text-white'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Integration Menu Group */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]/80 font-mono">
                INTEGRASI
              </span>
            </div>
            <nav className="space-y-1">
              <a
                href="https://financialku.pages.dev/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap group text-[#94A3B8] hover:text-white hover:bg-[#0B2545] border border-transparent hover:border-[#1E3A5F]"
                title="Buka FinancialKu di tab browser baru"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <WalletCards className="w-4 h-4 shrink-0 text-[#94A3B8] group-hover:text-[#22D3EE] transition-colors" />
                  <span className="truncate">FinancialKu</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8]/60 group-hover:text-[#22D3EE] transition-colors shrink-0 ml-2" />
              </a>
            </nav>
          </div>

          {/* System Menu Group */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]/80 font-mono">
                SYSTEM
              </span>
            </div>
            <nav className="space-y-1">
              {SYSTEM_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white shadow-md shadow-[#0EA5E9]/30 border border-[#22D3EE]/40'
                          : 'text-[#94A3B8] hover:text-white hover:bg-[#0B2545] border border-transparent'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-[#22D3EE]' : 'text-[#94A3B8] group-hover:text-white'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: User Identity + FinancialKu Badge + Sign Out */}
        <div className="p-4 border-t border-[#15385F] bg-[#071B35]/70 space-y-3">
          {/* FinancialKu Connection Indicator */}
          <div className="px-3 py-2 rounded-xl bg-[#102D50] border border-[#1E3A5F] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10b981] animate-pulse" />
              <span className="text-slate-300 font-medium">FinancialKu</span>
            </div>
            <span className="text-[10px] font-semibold text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-md border border-[#10B981]/30">
              Connected
            </span>
          </div>

          {/* User profile row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[#15385F] border border-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] font-bold text-xs shrink-0 shadow-sm">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#F8FAFC] truncate capitalize">
                  {displayName}
                </p>
                <p className="text-[10px] text-[#94A3B8] truncate">
                  Founder & Executive
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              title="Keluar dari akun"
              className="p-2 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#102D50] rounded-xl transition-colors border border-transparent hover:border-[#EF4444]/30"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#071B35]">
        {/* Modern Enterprise Top Header */}
        <header className="hidden md:flex items-center justify-between gap-6 px-8 py-3.5 bg-[#061A32]/95 backdrop-blur-md border-b border-[#15385F] sticky top-0 z-30 shadow-sm">
          {/* Breadcrumb & Context */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#94A3B8] font-medium">Life OS</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]/60" />
            <span className="font-bold text-[#22D3EE] bg-[#0EA5E9]/10 px-2.5 py-1 rounded-lg border border-[#22D3EE]/20">
              {currentNav?.label || 'Dashboard'}
            </span>
          </div>

          {/* Greeting & Date & Actions */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Time-based greeting */}
            <div className="text-right">
              <p className="text-xs font-bold text-[#F8FAFC] flex items-center justify-end gap-1.5">
                <span>{greeting},</span>
                <span className="text-[#22D3EE] capitalize">{displayName}</span>
              </p>
              <p className="text-[11px] text-[#94A3B8] font-mono">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* FinancialKu Status Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102D50] border border-[#10B981]/30 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-[11px] text-slate-300 font-medium">FinancialKu Sync</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10b981]" />
            </div>

            {/* Notification button */}
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-xl bg-[#102D50] hover:bg-[#15385F] border border-[#1E3A5F] text-[#94A3B8] hover:text-[#22D3EE] transition-colors"
                title="Notifikasi Sistem"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0EA5E9] ring-2 ring-[#061A32]" />
              </button>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {!isConfigured && <SupabaseSetupBanner />}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
