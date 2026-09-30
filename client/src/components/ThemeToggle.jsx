import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm'
      } ${className}`}
      aria-label="Toggle Theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 transform rotate-0 scale-100 transition-all duration-300" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transform rotate-90 scale-100 transition-all duration-300" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
