import { describe, expect, it } from "vitest";

import { sanitizeHtmlSafe, zSafeHtml } from "../html";

describe("sanitizeHtmlSafe", () => {
  it("allows basic HTML tags", () => {
    const result = sanitizeHtmlSafe("<p>Hello</p>");
    expect(result).toBe("<p>Hello</p>");
  });

  it("allows allowed tags like h1, table, img", () => {
    const input = '<h1>Title</h1><table><tr><td>Cell</td></tr></table><img src="https://example.com/img.png" alt="test" />';
    const result = sanitizeHtmlSafe(input);
    expect(result).toContain("<h1>");
    expect(result).toContain("<table>");
    expect(result).toContain("<img");
  });

  it("strips disallowed tags like script", () => {
    const result = sanitizeHtmlSafe("<script>alert('xss')</script><p>safe</p>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>safe</p>");
  });

  it("strips disallowed tags like style", () => {
    const result = sanitizeHtmlSafe("<style>body{color:red}</style><p>safe</p>");
    expect(result).not.toContain("<style>");
    expect(result).toContain("<p>safe</p>");
  });

  it("strips onclick attributes", () => {
    const result = sanitizeHtmlSafe('<p onclick="alert(1)">safe</p>');
    expect(result).not.toContain("onclick");
    expect(result).toBe("<p>safe</p>");
  });

  it("allows safe attributes like class and style", () => {
    const result = sanitizeHtmlSafe('<p class="text-red" style="color:red">styled</p>');
    expect(result).toContain('class="text-red"');
    expect(result).toContain("color:red");
  });

  it("allows href, target, rel on anchor tags", () => {
    const result = sanitizeHtmlSafe('<a href="https://example.com" target="_blank" rel="noopener">link</a>');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank"');
  });

  it("strips javascript: URLs", () => {
    const result = sanitizeHtmlSafe('<a href="javascript:alert(1)">link</a>');
    expect(result).not.toContain("javascript");
  });

  it("allows http, https, and mailto schemes", () => {
    const a = sanitizeHtmlSafe('<a href="https://example.com">https</a>');
    const b = sanitizeHtmlSafe('<a href="http://example.com">http</a>');
    const c = sanitizeHtmlSafe('<a href="mailto:test@example.com">mail</a>');
    expect(a).toContain("https://");
    expect(b).toContain("http://");
    expect(c).toContain("mailto:");
  });

  it("strips ftp:// URLs", () => {
    const result = sanitizeHtmlSafe('<a href="ftp://files.example.com">ftp</a>');
    expect(result).not.toContain("ftp://");
  });

  it("handles empty string", () => {
    expect(sanitizeHtmlSafe("")).toBe("");
  });

  it("handles plain text without HTML", () => {
    expect(sanitizeHtmlSafe("just text")).toBe("just text");
  });
});

describe("zSafeHtml", () => {
  it("parses and sanitizes valid HTML", () => {
    const schema = zSafeHtml();
    const result = schema.parse("<p>Hello</p><script>bad</script>");
    expect(result).toBe("<p>Hello</p>");
  });

  it("passes through safe HTML unchanged", () => {
    const schema = zSafeHtml();
    const result = schema.parse("<p>Safe content</p>");
    expect(result).toBe("<p>Safe content</p>");
  });

  it("rejects non-string input", () => {
    const schema = zSafeHtml();
    expect(() => schema.parse(123 as any)).toThrow();
  });
});
