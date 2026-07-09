import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("email.send input schema", () => {
  // Must match the real schema in email.ts (without refine for isolated tests)
  const baseInput = z.object({
    smtpProfileId: z.string().optional(),
    to: z.union([z.string().email(), z.array(z.string().email())]),
    subject: z.string().min(1).max(998).optional(),
    htmlBody: z.string().optional(),
    textBody: z.string().optional(),
    from: z.string().optional(),
    replyTo: z.string().email().optional(),
    cc: z.string().optional(),
    bcc: z.string().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    priority: z.enum(["transactional", "bulk"]).default("bulk"),
    scheduledAt: z.number().optional(),
    templateId: z.string().optional(),
    variables: z.record(z.string(), z.string()).optional(),
  });

  it("accepts minimal input (to + subject + htmlBody)", () => {
    const result = baseInput.parse({
      to: "recipient@example.com",
      subject: "Test email",
      htmlBody: "<h1>Hello</h1>",
    });
    expect(result.to).toBe("recipient@example.com");
    expect(result.priority).toBe("bulk");
  });

  it("accepts to as an array of emails", () => {
    const result = baseInput.parse({
      to: ["a@b.com", "c@d.com"],
      subject: "test",
      htmlBody: "<p>test</p>",
    });
    expect(Array.isArray(result.to)).toBe(true);
    expect(result.to).toHaveLength(2);
  });

  it("defaults priority to bulk", () => {
    const result = baseInput.parse({
      to: "c@d.com",
      subject: "test",
      htmlBody: "<p>test</p>",
    });
    expect(result.priority).toBe("bulk");
  });

  it("accepts templateId without subject/htmlBody", () => {
    const result = baseInput.parse({
      to: "c@d.com",
      templateId: "tmpl-123",
      variables: { userName: "Alice" },
    });
    expect(result.templateId).toBe("tmpl-123");
    expect(result.variables?.userName).toBe("Alice");
  });

  it("rejects invalid email in to", () => {
    expect(() =>
      baseInput.parse({
        to: "not-an-email",
        subject: "test",
        htmlBody: "<p>test</p>",
      }),
    ).toThrow();
  });

  it("rejects invalid email in array", () => {
    expect(() =>
      baseInput.parse({
        to: ["a@b.com", "invalid"],
        subject: "test",
        htmlBody: "<p>test</p>",
      }),
    ).toThrow();
  });

  it("rejects subject over 998 characters", () => {
    expect(() =>
      baseInput.parse({
        to: "c@d.com",
        subject: "x".repeat(999),
        htmlBody: "<p>test</p>",
      }),
    ).toThrow();
  });

  it("accepts optional fields", () => {
    const result = baseInput.parse({
      to: "c@d.com",
      subject: "test",
      htmlBody: "<p>test</p>",
      smtpProfileId: "profile-1",
      from: "sender@example.com",
      replyTo: "reply@example.com",
      cc: "cc@example.com",
      bcc: "bcc@example.com",
      headers: { "X-Custom": "value" },
      priority: "transactional",
      scheduledAt: 1700000000000,
    });
    expect(result.smtpProfileId).toBe("profile-1");
    expect(result.from).toBe("sender@example.com");
    expect(result.replyTo).toBe("reply@example.com");
    expect(result.priority).toBe("transactional");
  });

  it("rejects invalid replyTo", () => {
    expect(() =>
      baseInput.parse({
        to: "c@d.com",
        subject: "test",
        htmlBody: "<p>test</p>",
        replyTo: "not-an-email",
      }),
    ).toThrow();
  });

  it("rejects invalid priority", () => {
    expect(() =>
      baseInput.parse({
        to: "c@d.com",
        subject: "test",
        htmlBody: "<p>test</p>",
        priority: "invalid",
      }),
    ).toThrow();
  });

  it("accepts only textBody (no htmlBody)", () => {
    const result = baseInput.parse({
      to: "c@d.com",
      subject: "test",
      textBody: "Plain text only",
    });
    expect(result.textBody).toBe("Plain text only");
  });
});

describe("email.list input schema", () => {
  const listInput = z.object({
    limit: z.number().default(50),
    offset: z.number().default(0),
    status: z.enum(["queued", "sending", "sent", "failed", "bounced"]).optional(),
    priority: z.enum(["transactional", "bulk"]).optional(),
  });

  it("applies defaults", () => {
    const result = listInput.parse({});
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
    expect(result.status).toBeUndefined();
  });

  it("accepts valid filters", () => {
    const result = listInput.parse({ status: "failed", priority: "transactional" });
    expect(result.status).toBe("failed");
    expect(result.priority).toBe("transactional");
  });

  it("rejects invalid status", () => {
    expect(() => listInput.parse({ status: "unknown" })).toThrow();
  });

  it("accepts limit of 1", () => {
    const result = listInput.parse({ limit: 1 });
    expect(result.limit).toBe(1);
  });
});

describe("template.create input schema", () => {
  const createInput = z.object({
    name: z.string().min(1),
    subject: z.string().min(1),
    htmlBody: z.string().min(1),
    textBody: z.string().optional(),
    variables: z.array(z.string()).optional(),
  });

  it("accepts valid template input with variables", () => {
    const result = createInput.parse({
      name: "Welcome Email",
      subject: "Welcome {{userName}}",
      htmlBody: "<h1>Hi {{userName}}</h1>",
      variables: ["userName"],
    });
    expect(result.variables).toEqual(["userName"]);
  });

  it("rejects empty name", () => {
    expect(() => createInput.parse({ name: "", subject: "test", htmlBody: "<p>test</p>" })).toThrow();
  });

  it("rejects empty htmlBody", () => {
    expect(() => createInput.parse({ name: "test", subject: "test", htmlBody: "" })).toThrow();
  });
});

describe("template.update input schema", () => {
  const updateInput = z.object({
    id: z.string().min(1),
    name: z.string().min(1).optional(),
    subject: z.string().min(1).optional(),
    htmlBody: z.string().min(1).optional(),
    textBody: z.string().optional(),
    variables: z.array(z.string()).optional(),
  });

  it("accepts partial update with only id", () => {
    const result = updateInput.parse({ id: "abc" });
    expect(result.id).toBe("abc");
  });

  it("rejects update without id", () => {
    expect(() => updateInput.parse({ name: "test" })).toThrow();
  });
});

describe("smtp-profile.create input schema", () => {
  const createInput = z.object({
    label: z.string().min(1),
    host: z.string().min(1),
    port: z.number().int().positive(),
    username: z.string().min(1),
    password: z.string().min(1),
    authType: z.enum(["plain", "login", "cram-md5"]).default("plain"),
    maxSendsPerMinute: z.number().int().positive().default(60),
    isDefault: z.boolean().default(false),
    secure: z.boolean().default(false),
    startTls: z.boolean().default(true),
  });

  it("accepts valid input with defaults", () => {
    const result = createInput.parse({ label: "Relay", host: "smtp.example.com", port: 587, username: "u", password: "p" });
    expect(result.authType).toBe("plain");
    expect(result.maxSendsPerMinute).toBe(60);
  });

  it("rejects non-positive port", () => {
    expect(() => createInput.parse({ label: "t", host: "h", port: 0, username: "u", password: "p" })).toThrow();
  });

  it("rejects float port", () => {
    expect(() => createInput.parse({ label: "t", host: "h", port: 587.5, username: "u", password: "p" })).toThrow();
  });

  it("rejects empty label", () => {
    expect(() => createInput.parse({ label: "", host: "h", port: 587, username: "u", password: "p" })).toThrow();
  });

  it("accepts all optional fields", () => {
    const result = createInput.parse({
      label: "test", host: "host", port: 465, username: "u", password: "p",
      authType: "cram-md5", maxSendsPerMinute: 30, isDefault: true, secure: true, startTls: false,
    });
    expect(result.authType).toBe("cram-md5");
    expect(result.isDefault).toBe(true);
    expect(result.secure).toBe(true);
  });

  it("rejects invalid auth type", () => {
    expect(() => createInput.parse({ label: "t", host: "h", port: 587, username: "u", password: "p", authType: "oauth" })).toThrow();
  });
});

describe("smtp-profile.update input schema", () => {
  const updateInput = z.object({
    id: z.string().min(1),
    label: z.string().min(1).optional(),
    host: z.string().min(1).optional(),
    port: z.number().int().positive().optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    authType: z.enum(["plain", "login", "cram-md5"]).optional(),
    isDefault: z.boolean().optional(),
  });

  it("accepts partial update with only id", () => {
    const result = updateInput.parse({ id: "p1" });
    expect(result.id).toBe("p1");
  });

  it("rejects update without id", () => {
    expect(() => updateInput.parse({ label: "test" })).toThrow();
  });
});

describe("api-key input schemas", () => {
  const createSchema = z.object({ name: z.string().min(1) });
  const revokeSchema = z.object({ keyId: z.string().min(1) });

  it("creates with valid name", () => {
    expect(createSchema.parse({ name: "my-service" }).name).toBe("my-service");
  });

  it("rejects empty name", () => {
    expect(() => createSchema.parse({ name: "" })).toThrow();
  });

  it("revoke accepts valid keyId", () => {
    expect(revokeSchema.parse({ keyId: "key_123" }).keyId).toBe("key_123");
  });

  it("revoke rejects empty keyId", () => {
    expect(() => revokeSchema.parse({ keyId: "" })).toThrow();
  });
});
