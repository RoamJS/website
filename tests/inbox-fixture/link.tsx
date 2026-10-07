import type { AnchorHTMLAttributes } from "react";
export default function Link({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>): React.JSX.Element {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        history.pushState(null, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }}
    >
      {children}
    </a>
  );
}
