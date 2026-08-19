import { cn } from "@/lib/utils";

type MarketingPhotoProps = {
  /** Path without extension, e.g. /marketing/hero-keepsakes */
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  testId?: string;
};

/** JPEG + WebP still-life from client/public/marketing. */
export function MarketingPhoto({
  src,
  alt,
  width,
  height,
  className,
  imgClassName,
  eager = false,
  testId,
}: MarketingPhotoProps) {
  return (
    <picture className={className}>
      <source type="image/webp" srcSet={`${src}.webp`} />
      <img
        src={`${src}.jpg`}
        alt={alt}
        width={width}
        height={height}
        className={cn("bg-secondary/40", imgClassName)}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding={eager ? "sync" : "async"}
        data-testid={testId}
      />
    </picture>
  );
}
