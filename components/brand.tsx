import Image from "next/image";

export const Brand = ({
  compact = false,
}: {
  compact?: boolean;
}): React.JSX.Element => (
  <span
    className={`inline-flex items-center gap-1 font-semibold tracking-tight transition-[font-size] duration-200 motion-reduce:transition-none ${compact ? "text-xl lg:text-[28px]" : "text-[22px] lg:text-[40px]"}`}
  >
    <Image
      src="/roamjs-logo.png"
      alt=""
      width={460}
      height={460}
      className={`object-contain transition-[width,height] duration-200 motion-reduce:transition-none ${compact ? "size-9 lg:size-14" : "size-11 lg:size-20"}`}
      priority
    />
    RoamJS
  </span>
);
