export default function DevicePlaceholderSection({
  title,
  description,
  compact = false,
}: {
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <section className={`rounded-2xl border border-dashed border-stone-300 bg-stone-50 ${compact ? "p-3" : "p-4"}`}>
      <div className="text-sm font-medium text-stone-800">{title}</div>
      {description ? <div className="mt-2 text-xs text-stone-500">{description}</div> : null}
    </section>
  );
}
