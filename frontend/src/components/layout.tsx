import type {ReactNode} from 'react';
import {ArrowLeft, FileText, Home, Plus, Settings} from 'lucide-react';
import type {Screen} from '../types';

export function Header({
  title,
  subtitle,
  showBack,
  onBack,
  rightElement,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {showBack ? (
            <button type="button" onClick={onBack} aria-label="Go back" className="mt-0.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
              <ArrowLeft size={18} />
            </button>
          ) : null}
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {rightElement}
      </div>
    </header>
  );
}

export function BottomNav({
  currentScreen,
  setScreen,
}: {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
}) {
  const items: Array<{id: Screen; label: string; icon: ReactNode}> = [
    {id: 'home', label: 'Home', icon: <Home size={18} />},
    {id: 'new-inspection', label: 'New', icon: <Plus size={18} />},
    {id: 'reports', label: 'Reports', icon: <FileText size={18} />},
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map((item) => {
          const active = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setScreen(item.id)}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 text-xs font-medium ${
                active ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
        <button type="button" className="flex flex-col items-center gap-1 rounded-xl px-4 py-1 text-xs font-medium text-slate-400">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}

export function SectionCard({children}: {children: ReactNode}) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">{children}</section>;
}

export function statusPill(status: string) {
  if (status === 'completed' || status === 'confirmed') {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (status === 'processing' || status === 'review') {
    return 'bg-amber-100 text-amber-700';
  }
  if (status === 'capturing') {
    return 'bg-blue-100 text-blue-700';
  }
  return 'bg-slate-100 text-slate-600';
}

export function formatCondition(condition: string | null | undefined) {
  if (!condition) {
    return 'Pending';
  }
  if (condition === 'na') {
    return 'N/A';
  }
  return condition.replace(/_/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase());
}
