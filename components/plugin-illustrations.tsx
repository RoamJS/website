const QueryBuilderIllustration = (): React.JSX.Element => (
  <svg
    className="h-full w-full font-sans"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 180 140"
    aria-hidden="true"
    focusable="false"
  >
    <rect
      x="16"
      y="15"
      width="153"
      height="118"
      rx="7"
      className="fill-background stroke-border [stroke-width:0.8]"
    />
    <g transform="rotate(-3 87 70)">
      <rect
        x="8"
        y="7"
        width="155"
        height="119"
        rx="7"
        className="fill-card stroke-border [stroke-width:1.2]"
      />
      <text x="20" y="26" className="fill-muted-foreground" fontSize="8">
        FIND
      </text>
      <rect
        x="52"
        y="15"
        width="58"
        height="17"
        rx="4"
        className="fill-accent stroke-primary/35 [stroke-width:0.8]"
      />
      <text x="59" y="27" className="fill-primary" fontSize="10">
        Pages
      </text>
      <path
        d="M19 36L151 36"
        className="fill-none stroke-border [stroke-width:1]"
      />
      <text x="20" y="53" className="fill-muted-foreground" fontSize="8">
        WHERE
      </text>
      <rect
        x="19"
        y="61"
        width="133"
        height="23"
        rx="4"
        className="fill-accent stroke-primary/35 [stroke-width:0.8]"
      />
      <text x="27" y="76" className="fill-muted-foreground" fontSize="10">
        tag
      </text>
      <text x="59" y="76" className="fill-muted-foreground" fontSize="9">
        is
      </text>
      <text x="79" y="76" className="fill-primary" fontSize="10">
        [[Projects]]
      </text>
      <circle cx="22" cy="94" r="2" className="fill-brand-orange" />
      <text x="30" y="97" className="fill-muted-foreground" fontSize="9">
        AND status = Active
      </text>
      <rect
        x="100"
        y="105"
        width="51"
        height="15"
        rx="4"
        className="fill-primary"
      />
      <text x="111" y="116" className="fill-primary-foreground" fontSize="9">
        Run →
      </text>
    </g>
  </svg>
);

const WorkbenchIllustration = (): React.JSX.Element => (
  <svg
    className="h-full w-full font-sans"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 180 140"
    aria-hidden="true"
    focusable="false"
  >
    <rect
      x="8"
      y="8"
      width="120"
      height="86"
      rx="7"
      className="fill-card stroke-border [stroke-width:1.2]"
    />
    <text x="19" y="26" className="fill-foreground" fontSize="10">
      Meeting notes
    </text>
    <circle cx="20" cy="44" r="2" className="fill-muted-foreground" />
    <path
      d="M28 44L111 44"
      className="fill-none stroke-border [stroke-width:1]"
    />
    <rect
      x="15"
      y="53"
      width="105"
      height="23"
      rx="4"
      className="fill-accent stroke-primary/35 [stroke-width:0.8]"
    />
    <circle cx="21" cy="64" r="2" className="fill-primary" />
    <text x="29" y="68" className="fill-primary" fontSize="9">
      A useful idea
    </text>
    <path
      d="M73 77c-2 20 35 9 36 28m-5-4 5 5 4-5"
      className="fill-none stroke-brand-orange [stroke-width:1.7]"
    />
    <rect
      x="98"
      y="95"
      width="71"
      height="33"
      rx="6"
      className="fill-brand-orange/10 stroke-brand-orange/50 [stroke-width:0.8]"
    />
    <text
      x="110"
      y="115"
      className="fill-brand-orange-foreground"
      fontSize="10"
    >
      [[Inbox]]
    </text>
    <rect
      x="112"
      y="36"
      width="59"
      height="40"
      rx="5"
      className="fill-card stroke-border [stroke-width:1.2]"
    />
    <text x="120" y="52" className="fill-muted-foreground" fontSize="8">
      Move to
    </text>
    <text x="120" y="65" className="fill-foreground" fontSize="9">
      page →
    </text>
  </svg>
);

export const PluginIllustration = ({
  slug,
}: {
  slug: "query-builder" | "workbench";
}): React.JSX.Element => (
  <span aria-hidden="true" className="hidden h-28 w-36 shrink-0 xl:block">
    {slug === "query-builder" ? (
      <QueryBuilderIllustration />
    ) : (
      <WorkbenchIllustration />
    )}
  </span>
);
