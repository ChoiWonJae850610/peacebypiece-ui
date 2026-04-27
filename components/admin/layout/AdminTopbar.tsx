type AdminTopbarProps = {
  title: string;
  description: string;
};

export default function AdminTopbar({ title, description }: AdminTopbarProps) {
  return (
    <header className="rounded-[32px] border border-stone-200 bg-white/95 p-5 shadow-sm backdrop-blur">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">ADMIN DASHBOARD</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950 md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">{description}</p>
      </div>
    </header>
  );
}
