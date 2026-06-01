import sanitizeHtml from "sanitize-html";

export function sanitizeUserContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "code", "pre"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}

export function sanitizePlainText(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
}
