// Converts bare numeric references like [1] to Markdown links labeled as [n]
// pointing to the given URL list. We escape brackets so the visible label is [n].
export function toMarkdownWithCitationLinks(content: string, citations?: string[]) {
  if (!citations || citations.length === 0) return content;
  return content.replace(/\[(\d+)\](?!\()/g, (match, p1) => {
    const ordinal = parseInt(p1, 10);
    const url = citations[ordinal - 1];
    return url ? `[\\[${ordinal}\\]](${url})` : match;
  });
}


