import Image from "next/image";

export const Brand = (): React.JSX.Element => (
  <span className="inline-flex items-center gap-1 text-[22px] font-semibold tracking-tight lg:text-[40px]">
    <Image
      src="/roamjs-logo.png"
      alt=""
      width={460}
      height={460}
      className="size-11 object-contain lg:size-20"
      priority
    />
    RoamJS
  </span>
);
