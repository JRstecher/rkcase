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

export function SkinPreviewImage(props: Props) {
  /** CDN externes : évite échecs d’optimisation / domaines non listés en dev. */
  const unoptimized =
    props.src.startsWith("data:") || /^https?:\/\//i.test(props.src);

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
