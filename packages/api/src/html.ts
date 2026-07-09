import sanitizeHtml from "sanitize-html";
import { z } from "zod";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "br",
    "hr",
    "details",
    "summary",
  ]),
  allowedAttributes: {
    "*": ["style", "class", "id"],
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  },
  allowedStyles: {
    "*": {
      color: [/.*/],
      "background-color": [/.*/],
      "font-size": [/.*/],
      "font-family": [/.*/],
      "font-weight": [/.*/],
      "text-align": [/.*/],
      "text-decoration": [/.*/],
      "line-height": [/.*/],
      "margin": [/.*/],
      "padding": [/.*/],
      "border": [/.*/],
      "border-radius": [/.*/],
      width: [/.*/],
      "max-width": [/.*/],
      height: [/.*/],
      "max-height": [/.*/],
    },
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  enforceHtmlBoundary: true,
};

export function sanitizeHtmlSafe(input: string): string {
  return sanitizeHtml(input, SANITIZE_OPTIONS);
}

export function zSafeHtml() {
  return z
    .string()
    .transform((val) => sanitizeHtmlSafe(val))
    .pipe(z.string());
}
