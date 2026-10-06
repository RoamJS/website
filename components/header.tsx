import { HeaderNavigation } from "./header-navigation";
import { isAuthConfigured } from "@/lib/features";

export const Header = (): React.JSX.Element => (
  <HeaderNavigation authEnabled={isAuthConfigured()} />
);
