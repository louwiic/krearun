// Email clients have no website origin to resolve relative images or links.
export function newsletterPublicUrl(value: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(value) || !value.trim()) return value;
  return new URL(value, "https://krearun.re/").href;
}

export function normalizeNewsletterUrls(html: string): string {
  return html.replace(/<[^>]+>/g, (tag) =>
    tag.replace(/(\s(?:src|href)\s*=\s*)(?:(["'])(.*?)\2|([^\s>]+))/gi,
      (attribute, prefix: string, quote: string | undefined, quoted: string | undefined, unquoted: string | undefined) => {
        const value = quoted ?? unquoted ?? "";
        const absolute = newsletterPublicUrl(value);
        if (absolute === value) return attribute;
        const delimiter = quote || '"';
        return `${prefix}${delimiter}${absolute}${delimiter}`;
      }),
  );
}
