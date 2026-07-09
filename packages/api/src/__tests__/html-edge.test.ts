import { describe, expect, it } from "vitest";

import { sanitizeHtmlSafe } from "../html";

describe("sanitizeHtmlSafe - XSS edge cases", () => {
  it("strips script tags with various encodings", () => {
    const inputs = [
      '<script>alert("xss")</script>',
      '<SCRIPT>alert("xss")</SCRIPT>',
      '<ScRiPt>alert("xss")</ScRiPt>',
      '<script type="text/javascript">alert(1)</script>',
      '<script src="https://evil.com/hack.js"></script>',
    ];
    for (const input of inputs) {
      expect(sanitizeHtmlSafe(input)).not.toContain("script");
      expect(sanitizeHtmlSafe(input)).not.toContain("alert");
    }
  });

  it("strips event handlers", () => {
    const inputs = [
      '<p onclick="alert(1)">test</p>',
      '<p onmouseover="alert(1)">test</p>',
      '<p onload="alert(1)">test</p>',
      '<p onerror="alert(1)">test</p>',
      '<body onload="alert(1)">test</body>',
      '<img onerror="alert(1)" src=x />',
    ];
    for (const input of inputs) {
      const result = sanitizeHtmlSafe(input);
      expect(result).not.toMatch(/on\w+=/);
    }
  });

  it("strips javascript: URLs", () => {
    const inputs = [
      '<a href="javascript:alert(1)">link</a>',
      '<a href="javascript:void(0)">link</a>',
      '<a href="JAVASCRIPT:alert(1)">link</a>',
      '<a href=" javaScript:alert(1)">link</a>',
      '<img src="javascript:alert(1)" />',
    ];
    for (const input of inputs) {
      const result = sanitizeHtmlSafe(input);
      expect(result).not.toMatch(/javascript/i);
    }
  });

  it("strips data: URIs in unsafe contexts", () => {
    const result = sanitizeHtmlSafe('<a href="data:text/html,<script>alert(1)</script>">link</a>');
    expect(result).not.toContain("data:");
  });

  it("strips vbscript: URLs", () => {
    const result = sanitizeHtmlSafe('<a href="vbscript:msgbox(1)">link</a>');
    expect(result).not.toContain("vbscript");
  });

  it("removes iframe tags", () => {
    const inputs = [
      '<iframe src="https://evil.com"></iframe>',
      '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
      '<iframe>',
    ];
    for (const input of inputs) {
      expect(sanitizeHtmlSafe(input)).not.toContain("iframe");
    }
  });

  it("removes embed and object tags", () => {
    expect(sanitizeHtmlSafe('<embed src="evil.swf" />')).not.toContain("embed");
    expect(sanitizeHtmlSafe('<object data="evil.swf"></object>')).not.toContain("object");
  });

  it("handles nested HTML gracefully", () => {
    const result = sanitizeHtmlSafe("<div><p><span>nested</span></p></div>");
    expect(result).toContain("<div>");
    expect(result).toContain("<p>");
    expect(result).toContain("<span>");
  });

  it("handles HTML with comments", () => {
    const result = sanitizeHtmlSafe("<p>Hello<!-- comment --> world</p>");
    expect(result).not.toContain("<!--");
    expect(result).toContain("Hello");
  });

  it("handles DOCTYPE declaration", () => {
    const result = sanitizeHtmlSafe("<!DOCTYPE html><html><body>test</body></html>");
    expect(result).not.toContain("DOCTYPE");
    expect(result).toContain("test");
  });

  it("preserves allowed inline styles", () => {
    const result = sanitizeHtmlSafe('<p style="color: red; font-size: 16px;">styled</p>');
    expect(result).toContain("color");
    expect(result).toContain("16px");
  });

  it("strips unsafe style properties like position", () => {
    const result = sanitizeHtmlSafe('<div style="position: absolute; top: 0; left: 0; color: blue">test</div>');
    expect(result).toContain("test");
    expect(result).not.toContain("position");
  });

  it("strips meta tags", () => {
    const result = sanitizeHtmlSafe('<meta http-equiv="refresh" content="0;url=http://evil.com">');
    expect(result).not.toContain("meta");
  });

  it("handles null bytes", () => {
    const result = sanitizeHtmlSafe("<p>Hello\x00world</p>");
    expect(result).toContain("<p>");
  });

  it("handles very long strings without crashing", () => {
    const long = "<p>" + "a".repeat(10000) + "</p>";
    const result = sanitizeHtmlSafe(long);
    expect(result).toContain("<p>");
    expect(result.length).toBeGreaterThan(10000);
  });

  it("preserves table structure", () => {
    const input = "<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>";
    const result = sanitizeHtmlSafe(input);
    expect(result).toContain("<table>");
    expect(result).toContain("<thead>");
    expect(result).toContain("<tbody>");
    expect(result).toContain("<th>");
    expect(result).toContain("<td>");
  });

  it("preserves allowed img attributes", () => {
    const input = '<img src="https://example.com/image.png" alt="description" width="100" height="50" />';
    const result = sanitizeHtmlSafe(input);
    expect(result).toContain('src="https://example.com/image.png"');
    expect(result).toContain('alt="description"');
    expect(result).toContain('width="100"');
    expect(result).toContain('height="50"');
  });

  it("strips img attributes like onerror", () => {
    const result = sanitizeHtmlSafe('<img src="valid.png" onerror="alert(1)" />');
    expect(result).toContain('src="valid.png"');
    expect(result).not.toContain("onerror");
  });

  it("handles unclosed tags", () => {
    const result = sanitizeHtmlSafe("<p>unclosed<div>nested");
    expect(result).toContain("unclosed");
    expect(result).toContain("nested");
  });

  it("handles empty input", () => {
    expect(sanitizeHtmlSafe("")).toBe("");
  });

  it("handles only whitespace", () => {
    expect(sanitizeHtmlSafe("   ")).toBe("   ");
  });

  it("handles HTML entities", () => {
    const result = sanitizeHtmlSafe("<p>&amp; &lt; &gt; &quot;</p>");
    expect(result).toContain("&amp;");
    expect(result).toContain("&lt;");
  });

  it("strips link tags", () => {
    const result = sanitizeHtmlSafe('<link rel="stylesheet" href="evil.css" />');
    expect(result).not.toContain("link");
  });

  it("strips base tags", () => {
    const result = sanitizeHtmlSafe('<base href="https://evil.com/" />');
    expect(result).not.toContain("base");
  });

  it("strips form tags", () => {
    const result = sanitizeHtmlSafe('<form action="https://evil.com"><input type="submit" /></form>');
    expect(result).not.toContain("form");
    expect(result).not.toContain("input");
  });

  it("strips svg tags with event handlers", () => {
    const result = sanitizeHtmlSafe('<svg onload="alert(1)"></svg>');
    expect(result).not.toContain("svg");
  });

  it("strips math tags", () => {
    const result = sanitizeHtmlSafe("<math><mi>x</mi></math>");
    expect(result).not.toContain("math");
  });

  it("allows summary and details tags", () => {
    const input = "<details><summary>Click me</summary><p>Hidden content</p></details>";
    const result = sanitizeHtmlSafe(input);
    expect(result).toContain("<details>");
    expect(result).toContain("<summary>");
  });
});
