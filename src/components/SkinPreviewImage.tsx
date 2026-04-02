import Image from "next/image";

type Props =
  | {
      src: string;
      alt: string;
      className?: string;
      fill: true;
      sizes: string;
    }
  | {
      src: string;
      alt: string;
      className?: string;
      width: number;
      height: number;
    };

/** Aperçu skin : CDN Steam (optimisé) ou SVG data-URL (`unoptimized`). */
export function SkinPreviewImage(props: Props) {
  const unoptimized = props.src.startsWith("data:");

  if ("fill" in props && props.fill) {
    return (
      <Image
        src={props.src}
        alt={props.alt}
        fill
        sizes={props.sizes}
        className={props.className}
        unoptimized={unoptimized}
        draggable={false}
      />
    );
  }

  const { src, alt, className, width, height } = props as Extract<
    Props,
    { width: number; height: number }
  >;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized={unoptimized}
      draggable={false}
    />
  );
}
