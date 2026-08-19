export function SectionHeading({
  eyebrow,
  title,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">{title}</h2>
    </div>
  );
}
