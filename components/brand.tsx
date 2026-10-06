import Image from "next/image";

export const Brand = (): React.JSX.Element => (
  <span className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
    <Image
      src="/roamjs-logo.png"
      alt=""
      width={460}
      height={460}
      className="size-12 object-contain md:size-14"
      priority
    />
    RoamJS
  </span>
);
