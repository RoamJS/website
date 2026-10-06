import Image from "next/image";

export const Brand = (): React.JSX.Element => (
  <span className="inline-flex items-center gap-1 text-2xl font-semibold tracking-tight lg:text-[44px]">
    <Image
      src="/roamjs-logo.png"
      alt=""
      width={460}
      height={460}
      className="size-12 object-contain lg:size-22"
      priority
    />
    RoamJS
  </span>
);
