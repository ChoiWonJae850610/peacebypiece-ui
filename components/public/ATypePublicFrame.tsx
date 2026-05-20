import type { ReactNode } from "react";

type ATypePublicFrameProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  heroItems?: string[];
};

type ATypePublicCardProps = {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

type ATypePublicNoticeProps = {
  tone?: "neutral" | "info" | "warning" | "danger" | "success";
  children: ReactNode;
};

const noticeToneClassNames = {
  neutral:
    "border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] text-[var(--pbp-text-secondary)]",
  info: "border-[var(--pbp-status-info-bg)] bg-[var(--pbp-status-info-bg)] text-[var(--pbp-status-info-fg)]",
  warning:
    "border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)] text-[var(--pbp-status-warning-fg)]",
  danger:
    "border-[var(--pbp-status-danger-bg)] bg-[var(--pbp-status-danger-bg)] text-[var(--pbp-status-danger-fg)]",
  success:
    "border-[var(--pbp-status-success-bg)] bg-[var(--pbp-status-success-bg)] text-[var(--pbp-status-success-fg)]",
} as const;

export function WaflBrandMark() {
  return (
    <div
      aria-hidden="true"
      className="grid h-12 w-12 grid-cols-3 gap-1 rounded-[var(--pbp-radius-xl)] bg-[var(--pbp-brand-primary)] p-2 shadow-[var(--pbp-shadow-card-a-type)]"
    >
      {Array.from({ length: 9 }).map((_, index) => (
        <span key={index} className="rounded-[0.35rem] bg-[var(--pbp-brand-muted)]" />
      ))}
    </div>
  );
}

export function GoogleMark() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--pbp-surface-base)] text-xs font-black text-[var(--pbp-text-primary)] shadow-[var(--pbp-shadow-card-a-type)]">
      G
    </span>
  );
}

export function ATypePublicNotice({ tone = "neutral", children }: ATypePublicNoticeProps) {
  return (
    <div className={`rounded-[var(--pbp-radius-xl)] border px-5 py-4 text-sm font-bold leading-6 ${noticeToneClassNames[tone]}`}>
      {children}
    </div>
  );
}

export function ATypePublicCard({ eyebrow, title, description, children }: ATypePublicCardProps) {
  return (
    <aside className="w-full rounded-[var(--pbp-radius-modal)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] p-5 shadow-[var(--pbp-shadow-modal-a-type)] backdrop-blur sm:p-6 lg:p-7">
      <div className="space-y-5">
        {eyebrow || title || description ? (
          <div>
            {eyebrow ? (
              <p className="text-sm font-black text-[var(--pbp-brand-soft)]">{eyebrow}</p>
            ) : null}
            {title ? (
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[var(--pbp-text-primary)]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-3 text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </aside>
  );
}

export function ATypePublicFrame({
  eyebrow,
  title,
  description,
  children,
  footer,
  heroItems = ["협력업체", "파일", "작업 상태", "승인 흐름"],
}: ATypePublicFrameProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--pbp-bg-app)] px-5 py-6 text-[var(--pbp-text-primary)] sm:px-8 sm:py-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(var(--pbp-border-strong)_1px,transparent_1px),linear-gradient(90deg,var(--pbp-border-strong)_1px,transparent_1px)] [background-size:58px_58px]" />
      <div className="pointer-events-none absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-[var(--pbp-brand-muted)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-7rem] right-[-8rem] h-96 w-96 rounded-full bg-[var(--pbp-brand-muted)] blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--pbp-surface-base)] blur-3xl" />

      <section className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-between gap-8 lg:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WaflBrandMark />
            <div>
              <p className="text-2xl font-black tracking-[-0.04em] text-[var(--pbp-text-primary)]">WAFL</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--pbp-brand-soft)]">
                Work Assignment Flow
              </p>
            </div>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.54fr)] lg:gap-14">
          <article className="max-w-3xl space-y-8 sm:space-y-10">
            <div className="space-y-5 sm:space-y-6">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--pbp-brand-soft)]">{eyebrow}</p>
              <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.07em] text-[var(--pbp-text-primary)] sm:text-6xl lg:text-7xl">
                {title}
              </h1>
              <p className="max-w-2xl text-base font-bold leading-7 text-[var(--pbp-text-secondary)] sm:text-lg">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {heroItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-3 py-1 text-xs font-bold text-[var(--pbp-text-secondary)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </article>

          {children}
        </div>

        {footer ? (
          <footer className="relative text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
            {footer}
          </footer>
        ) : null}
      </section>
    </main>
  );
}
