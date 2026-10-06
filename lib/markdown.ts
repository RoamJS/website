export const prepareReadme = (markdown: string): string =>
  markdown
    .replace(/<a href="https:\/\/roamjs.com\/">[\s\S]*?<\/a>/g, "")
    .replace(/^\[!\[.*(?:badge|shields).*\n?/gm, "")
    .replace(/^# .+\n/m, "")
    .trim();
export const resolveReadmeUrl = ({
  url,
  readmeUrl,
  image = false,
}: {
  url: string;
  readmeUrl: string;
  image?: boolean;
}): string => {
  if (/^(https?:\/\/|mailto:|#)/i.test(url)) return url;
  if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith("//")) return "";
  const base = image
    ? readmeUrl
        .replace("https://github.com/", "https://raw.githubusercontent.com/")
        .replace("/blob/", "/")
    : readmeUrl;
  try {
    return new URL(url, base).href;
  } catch {
    return "";
  }
};
