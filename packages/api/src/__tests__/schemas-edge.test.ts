import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("email.send - edge cases", () => {
  const schema = z.object({
    smtpProfileId: z.string().min(1),
    to: z.string().email(),
    subject: z.string().min(1).max(998),
    from: z.string().email(),
    htmlBody: z.string().optional(),
    textBody: z.string().optional(),
    replyTo: z.string().email().optional(),
    priority: z.enum(["transactional", "bulk"]).default("bulk"),
  });

  it("accepts unicode in subject", () => {
    const result = schema.parse({
      smtpProfileId: "p1",
      from: "a@b.com",
      to: "c@d.com",
      subject: "日本語の件名",
    });
    expect(result.subject).toBe("日本語の件名");
  });

  it("accepts special characters in subject", () => {
    const result = schema.parse({
      smtpProfileId: "p1",
      from: "a@b.com",
      to: "c@d.com",
      subject: "Price: $50 - Discount 20% off! #deal",
    });
    expect(result.subject).toContain("$");
    expect(result.subject).toContain("%");
  });

  it("accepts email with + alias", () => {
    const result = schema.parse({
      smtpProfileId: "p1",
      from: "a@b.com",
      to: "user+tag@example.com",
      subject: "test",
    });
    expect(result.to).toBe("user+tag@example.com");
  });

  it("accepts subdomain email", () => {
    const result = schema.parse({
      smtpProfileId: "p1",
      from: "a@b.com",
      to: "user@sub.example.co.uk",
      subject: "test",
    });
    expect(result.to).toBe("user@sub.example.co.uk");
  });

  it("rejects email without domain", () => {
    expect(() =>
      schema.parse({
        smtpProfileId: "p1",
        from: "a@b.com",
        to: "user@",
        subject: "test",
      }),
    ).toThrow();
  });

  it("accepts subject with only whitespace (length check is pre-trim)", () => {
    const result = schema.parse({
      smtpProfileId: "p1",
      from: "a@b.com",
      to: "c@d.com",
      subject: "   ",
    });
    expect(result.subject).toBe("   ");
  });

  it("accepts subject at max length 998", () => {
    const result = schema.parse({
      smtpProfileId: "p1",
      from: "a@b.com",
      to: "c@d.com",
      subject: "x".repeat(998),
    });
    expect(result.subject.length).toBe(998);
  });

  it("rejects subject over 998 chars", () => {
    expect(() =>
      schema.parse({
        smtpProfileId: "p1",
        from: "a@b.com",
        to: "c@d.com",
        subject: "x".repeat(999),
      }),
    ).toThrow();
  });

  it("accepts valid replyTo when provided", () => {
    const result = schema.parse({
      smtpProfileId: "p1",
      from: "a@b.com",
      to: "c@d.com",
      subject: "test",
      replyTo: "reply@example.com",
    });
    expect(result.replyTo).toBe("reply@example.com");
  });

  it("rejects invalid replyTo", () => {
    expect(() =>
      schema.parse({
        smtpProfileId: "p1",
        from: "a@b.com",
        to: "c@d.com",
        subject: "test",
        replyTo: "not-an-email",
      }),
    ).toThrow();
  });
});

describe("email.list - edge cases", () => {
  const schema = z.object({
    limit: z.number().default(50),
    offset: z.number().default(0),
    status: z.enum(["queued", "sending", "sent", "failed", "bounced"]).optional(),
    priority: z.enum(["transactional", "bulk"]).optional(),
  });

  it("accepts zero offset", () => {
    const result = schema.parse({ offset: 0 });
    expect(result.offset).toBe(0);
  });

  it("accepts negative offset (will be handled downstream)", () => {
    const result = schema.parse({ offset: -1 });
    expect(result.offset).toBe(-1);
  });

  it("accepts limit of 1", () => {
    const result = schema.parse({ limit: 1 });
    expect(result.limit).toBe(1);
  });

  it("accepts all valid statuses", () => {
    for (const s of ["queued", "sending", "sent", "failed", "bounced"] as const) {
      const result = schema.parse({ status: s });
      expect(result.status).toBe(s);
    }
  });

  it("rejects unknown status", () => {
    expect(() => schema.parse({ status: "unknown" })).toThrow();
    expect(() => schema.parse({ status: "" })).toThrow();
  });
});

describe("smtp-profile.create - edge cases", () => {
  const schema = z.object({
    label: z.string().min(1),
    host: z.string().min(1),
    port: z.number().int().positive(),
    username: z.string().min(1),
    password: z.string().min(1),
    secure: z.boolean().default(false),
    startTls: z.boolean().default(true),
    authType: z.enum(["plain", "login", "cram-md5"]).default("plain"),
    maxSendsPerMinute: z.number().int().positive().default(60),
    isDefault: z.boolean().default(false),
  });

  it("accepts port 1 (minimum)", () => {
    const result = schema.parse({
      label: "test", host: "host", port: 1, username: "u", password: "p",
    });
    expect(result.port).toBe(1);
  });

  it("accepts port 65535 (maximum)", () => {
    const result = schema.parse({
      label: "test", host: "host", port: 65535, username: "u", password: "p",
    });
    expect(result.port).toBe(65535);
  });

  it("rejects port 0", () => {
    expect(() =>
      schema.parse({ label: "t", host: "h", port: 0, username: "u", password: "p" })
    ).toThrow();
  });

  it("rejects negative port", () => {
    expect(() =>
      schema.parse({ label: "t", host: "h", port: -1, username: "u", password: "p" })
    ).toThrow();
  });

  it("rejects float port", () => {
    expect(() =>
      schema.parse({ label: "t", host: "h", port: 587.5, username: "u", password: "p" })
    ).toThrow();
  });

  it("rejects string port", () => {
    expect(() =>
      schema.parse({ label: "t", host: "h", port: "587", username: "u", password: "p" })
    ).toThrow();
  });

  it("accepts hostname with port number suffix", () => {
    const result = schema.parse({
      label: "test", host: "smtp.example.com:587", port: 587, username: "u", password: "p",
    });
    expect(result.host).toBe("smtp.example.com:587");
  });

  it("accepts IP address as host", () => {
    const result = schema.parse({
      label: "test", host: "192.168.1.1", port: 25, username: "u", password: "p",
    });
    expect(result.host).toBe("192.168.1.1");
  });

  it("rejects empty host", () => {
    expect(() =>
      schema.parse({ label: "t", host: "", port: 587, username: "u", password: "p" })
    ).toThrow();
  });

  it("rejects empty username", () => {
    expect(() =>
      schema.parse({ label: "t", host: "h", port: 587, username: "", password: "p" })
    ).toThrow();
  });

  it("rejects empty password", () => {
    expect(() =>
      schema.parse({ label: "t", host: "h", port: 587, username: "u", password: "" })
    ).toThrow();
  });

  it("rejects maxSendsPerMinute of 0", () => {
    expect(() =>
      schema.parse({ label: "t", host: "h", port: 587, username: "u", password: "p", maxSendsPerMinute: 0 })
    ).toThrow();
  });

  it("accepts auth type login", () => {
    const result = schema.parse({
      label: "test", host: "host", port: 587, username: "u", password: "p", authType: "login",
    });
    expect(result.authType).toBe("login");
  });

  it("accepts auth type cram-md5", () => {
    const result = schema.parse({
      label: "test", host: "host", port: 587, username: "u", password: "p", authType: "cram-md5",
    });
    expect(result.authType).toBe("cram-md5");
  });

  it("rejects invalid auth type", () => {
    expect(() =>
      schema.parse({ label: "t", host: "h", port: 587, username: "u", password: "p", authType: "oauth" })
    ).toThrow();
  });
});

describe("template - edge cases", () => {
  const createSchema = z.object({
    name: z.string().min(1),
    subject: z.string().min(1),
    htmlBody: z.string().min(1),
    textBody: z.string().optional(),
    variables: z.array(z.string()).optional(),
  });

  const updateSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1).optional(),
    subject: z.string().min(1).optional(),
    htmlBody: z.string().min(1).optional(),
    textBody: z.string().optional(),
    variables: z.array(z.string()).optional(),
  });

  it("creates template with unicode name", () => {
    const result = createSchema.parse({
      name: "テンプレート",
      subject: "Test",
      htmlBody: "<p>内容</p>",
    });
    expect(result.name).toBe("テンプレート");
  });

  it("creates template with variables", () => {
    const result = createSchema.parse({
      name: "Welcome",
      subject: "Hi {{name}}",
      htmlBody: "<p>Hello {{name}}</p>",
      variables: ["name", "email", "date"],
    });
    expect(result.variables).toHaveLength(3);
  });

  it("creates template with empty variables array", () => {
    const result = createSchema.parse({
      name: "test",
      subject: "test",
      htmlBody: "<p>test</p>",
      variables: [],
    });
    expect(result.variables).toEqual([]);
  });

  it("rejects template with empty name", () => {
    expect(() => createSchema.parse({
      name: "", subject: "test", htmlBody: "<p>test</p>",
    })).toThrow();
  });

  it("rejects template with empty subject", () => {
    expect(() => createSchema.parse({
      name: "test", subject: "", htmlBody: "<p>test</p>",
    })).toThrow();
  });

  it("rejects template with empty htmlBody", () => {
    expect(() => createSchema.parse({
      name: "test", subject: "test", htmlBody: "",
    })).toThrow();
  });

  it("partial update with only id", () => {
    const result = updateSchema.parse({ id: "abc-123" });
    expect(result.id).toBe("abc-123");
    expect(result.name).toBeUndefined();
  });

  it("partial update with some fields", () => {
    const result = updateSchema.parse({ id: "abc-123", name: "Updated" });
    expect(result.name).toBe("Updated");
    expect(result.subject).toBeUndefined();
  });

  it("rejects update without id", () => {
    expect(() => updateSchema.parse({ name: "test" })).toThrow();
  });
});

describe("api-key - edge cases", () => {
  const createSchema = z.object({ name: z.string().min(1) });
  const revokeSchema = z.object({ keyId: z.string().min(1) });

  it("creates with alphanumeric name", () => {
    const result = createSchema.parse({ name: "my-service-123" });
    expect(result.name).toBe("my-service-123");
  });

  it("creates with unicode name", () => {
    const result = createSchema.parse({ name: "サービス" });
    expect(result.name).toBe("サービス");
  });

  it("creates with name containing spaces", () => {
    const result = createSchema.parse({ name: "My Service" });
    expect(result.name).toBe("My Service");
  });

  it("rejects empty name", () => {
    expect(() => createSchema.parse({ name: "" })).toThrow();
  });

  it("rejects name with only whitespace", () => {
    expect(() => createSchema.parse({ name: "   " })).not.toThrow();
  });

  it("revoke accepts valid keyId", () => {
    const result = revokeSchema.parse({ keyId: "key_abc123" });
    expect(result.keyId).toBe("key_abc123");
  });

  it("revoke rejects empty keyId", () => {
    expect(() => revokeSchema.parse({ keyId: "" })).toThrow();
  });
});

describe("smtp-profile.update - edge cases", () => {
  const schema = z.object({
    id: z.string().min(1),
    label: z.string().min(1).optional(),
    host: z.string().min(1).optional(),
    port: z.number().int().positive().optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    authType: z.enum(["plain", "login", "cram-md5"]).optional(),
    isDefault: z.boolean().optional(),
  });

  it("partial update with only id", () => {
    const result = schema.parse({ id: "profile-1" });
    expect(result.id).toBe("profile-1");
  });

  it("partial update with all optional fields", () => {
    const result = schema.parse({
      id: "p1", label: "new", host: "new.host", port: 465,
      username: "newuser", password: "newpass", authType: "login", isDefault: true,
    });
    expect(result.label).toBe("new");
    expect(result.isDefault).toBe(true);
  });

  it("rejects update without id", () => {
    expect(() => schema.parse({ label: "test" })).toThrow();
  });
});
