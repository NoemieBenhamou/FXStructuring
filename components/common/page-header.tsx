import { Badge } from "@/components/ui/badge";

export function PageHeader({
  eyebrow,
  title,
  description,
  badge
}: {
  eyebrow?: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-bank-border bg-bank-bgAlt/55 px-4 py-5 shadow-card sm:gap-4 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center gap-3">
        {eyebrow ? <div className="text-xs uppercase tracking-[0.24em] text-bank-gold">{eyebrow}</div> : null}
        {badge ? <Badge variant="blue">{badge}</Badge> : null}
      </div>
      <div className="space-y-2">
        <h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-bank-text sm:text-4xl">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-bank-muted sm:text-base sm:leading-7">{description}</p>
      </div>
    </div>
  );
}
