export const useSearchParams = (): URLSearchParams =>
  new URLSearchParams(location.search);
export const useRouter = (): { replace: (url: string) => void } => ({
  replace: (url: string): void => {
    history.replaceState(null, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  },
});
