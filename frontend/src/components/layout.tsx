import type {ReactNode} from 'react';
import type {LucideIcon} from 'lucide-react';
import {ArrowLeft, FileText, Home, Inbox, Plus, Sparkles} from 'lucide-react';
import type {Screen} from '../types';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type NavItem = {
  id: Screen;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  {id: 'home', label: 'Home', hint: 'Overview and active work', icon: Home},
  {id: 'new-inspection', label: 'New inspection', hint: 'Start capture or resume intake', icon: Plus},
  {id: 'reports', label: 'Reports', hint: 'Completed output and downloads', icon: FileText},
];

function activeNavScreen(currentScreen: Screen): Screen | null {
  if (currentScreen === 'home' || currentScreen === 'reports' || currentScreen === 'new-inspection') {
    return currentScreen;
  }
  return null;
}

function NavButton({
  active,
  item,
  onClick,
}: {
  active: boolean;
  item: NavItem;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex w-full items-start gap-3 rounded-3xl border px-4 py-3 text-left transition duration-200 ease-out',
        active
          ? 'border-blue-200 bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-200/50'
          : 'border-transparent bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50',
      )}
    >
      <div
        className={cx(
          'mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border transition duration-200 ease-out',
          active ? 'border-blue-200 bg-white text-blue-600' : 'border-slate-200 bg-slate-50 text-slate-500',
        )}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{item.label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{item.hint}</p>
      </div>
    </button>
  );
}

export function AppShell({
  currentScreen,
  setScreen,
  successMessage,
  error,
  children,
}: {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  successMessage?: string | null;
  error?: string | null;
  children: ReactNode;
}) {
  const active = activeNavScreen(currentScreen);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pb-24 pt-4 sm:px-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:pb-8 lg:pt-8 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:flex lg:flex-col lg:gap-5">
          <section className="wb-section-card bg-gradient-to-br from-white via-white to-slate-50">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              <Sparkles size={14} />
              Workbase
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Agency operations dashboard</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Move between intake, live inspection work, and finished reports in a wider, responsive shell built for desktop demos.
            </p>
          </section>

          <section className="wb-section-card p-3">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Navigate</p>
            <div className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <NavButton key={item.id} active={active === item.id} item={item} onClick={() => setScreen(item.id)} />
              ))}
            </div>
          </section>

          <section className="wb-section-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Route changes, buttons, and empty states now share the same motion and spacing rules, so the app feels consistent across screens.
            </p>
          </section>
        </aside>

        <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
          {successMessage ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
              {successMessage}
            </div>
          ) : null}
          {error ? (
            <div role="alert" className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : null}
          <div className="min-w-0 overflow-hidden rounded-[32px] border border-slate-200/80 bg-slate-50/80 shadow-xl shadow-slate-300/20 backdrop-blur">
            {children}
          </div>
        </div>

        <BottomNav currentScreen={currentScreen} setScreen={setScreen} />
      </div>
    </div>
  );
}

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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] items-start justify-between gap-4 px-5 py-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              <ArrowLeft size={18} />
            </button>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">{subtitle}</p> : null}
          </div>
        </div>
        {rightElement ? <div className="hidden shrink-0 sm:block">{rightElement}</div> : null}
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
  const active = activeNavScreen(currentScreen);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 pt-2 lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between rounded-[28px] border border-slate-200 bg-white/95 px-3 py-3 shadow-xl shadow-slate-300/20 backdrop-blur">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const isPrimaryAction = item.id === 'new-inspection';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setScreen(item.id)}
              className={cx(
                'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold transition duration-200 ease-out',
                isPrimaryAction
                  ? cx(
                    'relative -translate-y-2 rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-200/70 active:scale-[0.99]',
                    isActive ? 'bg-blue-700 shadow-blue-300/80' : 'hover:bg-blue-700',
                  )
                  : isActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-200/60'
                    : 'text-slate-400 active:scale-[0.99]',
              )}
            >
              <Icon size={18} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx('wb-page', className)}>{children}</div>;
}

export function ScreenStage({
  children,
  stageKey,
}: {
  children: ReactNode;
  stageKey: string;
}) {
  return (
    <div key={stageKey} className="wb-screen-stage">
      {children}
    </div>
  );
}

export function SectionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cx('wb-section-card', className)}>{children}</section>;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('wb-empty', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm">
        <Icon size={20} />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </section>
  );
}

export function LoadingCards({
  count = 2,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cx('grid gap-4', className)}>
      {Array.from({length: count}).map((_, index) => (
        <SectionCard key={index}>
          <div className="space-y-4">
            <div className="wb-skeleton h-4 w-24" />
            <div className="wb-skeleton h-8 w-3/4" />
            <div className="wb-skeleton h-4 w-full" />
            <div className="wb-skeleton h-4 w-5/6" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="wb-skeleton h-20 w-full" />
              <div className="wb-skeleton h-20 w-full" />
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

export function statusPill(status: string) {
  if (status === 'completed' || status === 'confirmed' || status === 'ready') {
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
  if (condition === 'damaged') {
    return 'Poor';
  }
  return condition.replace(/_/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase());
}
