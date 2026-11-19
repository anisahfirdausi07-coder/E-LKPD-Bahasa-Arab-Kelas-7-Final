import React from 'react';
import { StudentProfile } from '../types/elkpd';

export type AppView =
  | 'home'
  | 'login'
  | 'petunjuk'
  | 'dashboard'
  | 'dars'
  | 'evaluasi-hub'
  | 'teacher';

interface NavbarProps {
  currentView: AppView;
  student: StudentProfile | null;
  onNavigate: (view: AppView) => void;
  onLogoutStudent: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  student,
  onNavigate,
  onLogoutStudent,
}) => {
  const linkClass = (active: boolean) =>
    `text-sm font-semibold transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 ${
      active
        ? 'text-sky-700 border-sky-600'
        : 'text-slate-600 border-transparent hover:text-sky-700 hover:border-sky-200'
    }`;

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-xl sm:text-2xl font-bold text-sky-900 font-arabic tracking-normal whitespace-nowrap shrink-0 hover:text-sky-700 transition-colors cursor-pointer"
          dir="rtl"
          lang="ar"
        >
          هَيَّا نَتَعَلَّمُ!
        </button>

        {/* Zone 2: Exactly 5 Top-Level Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`${linkClass(currentView === 'home')} cursor-pointer`}
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className={`${linkClass(currentView === 'login')} cursor-pointer`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => onNavigate('petunjuk')}
            className={`${linkClass(currentView === 'petunjuk')} cursor-pointer`}
          >
            Petunjuk
          </button>
          <button
            type="button"
            onClick={() => onNavigate(student?.tier ? 'evaluasi-hub' : 'login')}
            className={`${linkClass(currentView === 'evaluasi-hub')} cursor-pointer`}
          >
            Evaluasi
          </button>
          <button
            type="button"
            onClick={() => onNavigate('teacher')}
            className={`${linkClass(currentView === 'teacher')} cursor-pointer`}
          >
            Dashboard Guru
          </button>
        </nav>

        {/* Zone 3: Primary Session Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {student && student.tier ? (
            <>
              {currentView !== 'dashboard' && currentView !== 'dars' && (
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Ruang Belajar
                </button>
              )}
              <button
                type="button"
                onClick={onLogoutStudent}
                className="px-4 py-2 text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Keluar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Mulai Belajar
            </button>
          )}
        </div>
      </div>

      {/* Mobile secondary nav row */}
      <div className="md:hidden border-t border-sky-50 px-4 py-2 flex items-center gap-5 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`${linkClass(currentView === 'home')} cursor-pointer`}
        >
          Beranda
        </button>
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className={`${linkClass(currentView === 'login')} cursor-pointer`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => onNavigate('petunjuk')}
          className={`${linkClass(currentView === 'petunjuk')} cursor-pointer`}
        >
          Petunjuk
        </button>
        <button
          type="button"
          onClick={() => onNavigate(student?.tier ? 'evaluasi-hub' : 'login')}
          className={`${linkClass(currentView === 'evaluasi-hub')} cursor-pointer`}
        >
          Evaluasi
        </button>
        <button
          type="button"
          onClick={() => onNavigate('teacher')}
          className={`${linkClass(currentView === 'teacher')} cursor-pointer`}
        >
          Dashboard Guru
        </button>
      </div>
    </header>
  );
};
