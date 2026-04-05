import Image from "next/image";

/** Caisse Sakura — `public/case-hell.png` (comme avant : Next/Image + `object-contain`). */
export function SakuraCaseImage({
  className = "",
  sizes = "220px",
  maxWidthClass = "max-w-[200px] sm:max-w-[220px]",
  alt = "Sakura Blossom Case",
}: {
  className?: string;
  sizes?: string;
  maxWidthClass?: string;
  alt?: string;
}) {
  return (
    <Image
      src="/case-hell.png"
      alt={alt}
      width={640}
      height={480}
      className={`h-auto w-full bg-transparent object-contain ${maxWidthClass} ${className}`.trim()}
      sizes={sizes}
      draggable={false}
    />
  );
}
