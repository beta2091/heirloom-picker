import { cn } from "@/lib/utils";

/**
 * Evenkeep brand mark.
 *
 * Concept: two interlocking rings woven together — one terracotta (primary),
 * one evergreen (accent) — symbolizing two lives / family bonds held together
 * in fair balance. The rings interlace (over-under) rather than merely overlap,
 * evoking a keepsake knot and a loom's woven threads. Fully self-contained SVG,
 * theme-aware via CSS variables, and legible from 20px to hero scale.
 *
 * Pass `mono` to render the mark in a single `currentColor` (useful on colored
 * or very small surfaces, e.g. a favicon-sized chip or a solid button).
 */

interface LogoIconProps {
  className?: string;
  mono?: boolean;
  /** Accessible label; omit and set aria-hidden via className usage for decorative marks. */
  title?: string;
}

export function LogoIcon({ className, mono = false, title }: LogoIconProps) {
  const ringA = mono ? "currentColor" : "hsl(var(--primary))";
  const ringB = mono ? "currentColor" : "hsl(var(--accent))";
  return (
    <svg
      viewBox="0 0 32 32"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ring A (terracotta) — drawn first, sits under B at the lower crossing */}
      <circle cx="13" cy="16" r="7.2" stroke={ringA} strokeWidth="2.4" />
      {/* Ring B (evergreen) — drawn over A */}
      <circle cx="19" cy="16" r="7.2" stroke={ringB} strokeWidth="2.4" />
      {/* Re-draw the top arc of Ring A over Ring B so the rings interlace (weave) */}
      <path
        d="M 12.37 8.83 A 7.2 7.2 0 0 1 18.90 11.87"
        stroke={ringA}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** Size of the icon in pixels (wordmark scales alongside). */
  iconClassName?: string;
  /** Hide the wordmark, show icon only. */
  iconOnly?: boolean;
  mono?: boolean;
}

/**
 * Full lockup: mark + "Evenkeep" wordmark. Wordmark uses the serif display face
 * (Libre Baskerville) for editorial, heirloom warmth.
 */
export function Logo({ className, iconClassName, iconOnly = false, mono = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoIcon
        className={cn("h-9 w-9", iconClassName)}
        mono={mono}
        title="Evenkeep"
      />
      {!iconOnly && (
        <span className="font-serif text-xl font-bold tracking-tight text-foreground">
          Evenkeep
        </span>
      )}
    </span>
  );
}

export default Logo;
