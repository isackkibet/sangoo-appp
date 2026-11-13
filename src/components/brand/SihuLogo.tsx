import Image from "next/image";

/*
 * The official Sango Information Hub logo, in one place.
 *  - "full": the wordmark (wave mark + "SANGO INFORMATION HUB" + "We care about Lake Victoria").
 *  - "mark": the round SIH wave mark on its own, for small spaces and dark backgrounds.
 * Both assets have dark lettering, so on dark surfaces pass `onDark` to sit them on a white tile.
 */
type Props = {
  variant?: "full" | "mark";
  /** Height classes, e.g. "h-10 md:h-12". Width follows the logo's own shape. */
  className?: string;
  onDark?: boolean;
  priority?: boolean;
  /** Leave empty when the logo sits next to the site name, so screen readers don't read it twice. */
  alt?: string;
};

export default function SihuLogo({ variant = "full", className, onDark = false, priority = false, alt = "Sango Information Hub (SIHU)" }: Props) {
  const img =
    variant === "full" ? (
      <Image
        src="/images/logo-main.png"
        alt={alt}
        width={815}
        height={244}
        priority={priority}
        sizes="(max-width: 768px) 160px, 220px"
        className={`${className ?? "h-10"} w-auto object-contain select-none`}
        draggable={false}
      />
    ) : (
      <Image
        src="/images/sihu-mark.png"
        alt={alt}
        width={256}
        height={256}
        priority={priority}
        sizes="64px"
        className={`${className ?? "h-9"} w-auto aspect-square object-contain select-none ${onDark ? "" : "rounded-full"}`}
        draggable={false}
      />
    );

  if (!onDark) return img;
  return (
    <span className={`inline-flex items-center justify-center bg-white shadow-sm ring-1 ring-black/5 ${variant === "full" ? "rounded-xl px-3 py-1.5" : "rounded-xl p-1"}`}>
      {img}
    </span>
  );
}
