import { expect, test } from "@playwright/test";

test.describe("Injection attacks", () => {
  test("SQL injection in smtpProfileId", async ({ request }) => {
    const payloads = [
      "1' OR '1'='1",
      "1; DROP TABLE email; --",
      "1' UNION SELECT * FROM user--",
      "' OR 1=1 --",
      "1' AND 1=1; DELETE FROM smtp_profile; --",
    ];
    for (const payload of payloads) {
      const res = await request.post("/rpc/email/send", {
        headers: { Authorization: "Bearer test-key" },
        data: { json: { smtpProfileId: payload, from: "a@b.com", to: "c@d.com", subject: "test" } },
      });
      expect([400, 401, 404]).toContain(res.status());
    }
  });

  test("SQL injection in to/from fields", async ({ request }) => {
    const payloads = [
      "'; DROP TABLE email; --'@test.com",
      "' OR '1'='1'@test.com",
      "test' OR 1=1--@test.com",
    ];
    for (const payload of payloads) {
      const res = await request.post("/rpc/email/send", {
        headers: { Authorization: "Bearer test-key" },
        data: { json: { smtpProfileId: "p1", from: "a@b.com", to: payload, subject: "test" } },
      });
      expect([400, 401]).toContain(res.status());
    }
  });

  test("NoSQL injection patterns are rejected as invalid", async ({ request }) => {
    const payloads = [
      '{"$gt": ""}',
      '{"$ne": ""}',
      '{"$where": "1==1"}',
    ];
    for (const payload of payloads) {
      const res = await request.post("/rpc/email/send", {
        headers: { Authorization: "Bearer test-key" },
        data: { json: { smtpProfileId: payload, from: "a@b.com", to: "c@d.com", subject: "test" } },
      });
      expect([400, 401]).toContain(res.status());
    }
  });

  test("XSS in subject field via API", async ({ request }) => {
    const payloads = [
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
      "{{constructor.constructor('alert(1)')()}}",
      "javascript:alert(1)",
    ];
    for (const payload of payloads) {
      const res = await request.post("/rpc/email/send", {
        headers: { Authorization: "Bearer test-key" },
        data: { json: { smtpProfileId: "p1", from: "a@b.com", to: "c@d.com", subject: payload } },
      });
      expect([400, 401]).toContain(res.status());
    }
  });
});

test.describe("SSRF attempts", () => {
  test("private IP in email fields", async ({ request }) => {
    const payloads = [
      "test@10.0.0.1",
      "test@172.16.0.1",
      "test@192.168.1.1",
      "test@127.0.0.1",
      "test@0.0.0.0",
      "test@[::1]",
      "test@[fd00::1]",
    ];
    for (const payload of payloads) {
      const res = await request.post("/rpc/email/send", {
        headers: { Authorization: "Bearer test-key" },
        data: { json: { smtpProfileId: "p1", from: payload, to: "c@d.com", subject: "test" } },
      });
      expect([400, 401]).toContain(res.status());
    }
  });

  test("internal hostnames in SMTP profile host", async ({ request }) => {
    const payloads = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "internal.service.local",
      "metadata.google.internal",
      "169.254.169.254",
    ];
    for (const payload of payloads) {
      const res = await request.post("/rpc/smtp-profile/create", {
        data: { json: { label: "test", host: payload, port: 587, username: "u", password: "p" } },
      });
      expect([400, 401]).toContain(res.status());
    }
  });
});

test.describe("Prototype pollution", () => {
  test("__proto__ key in JSON body", async ({ request }) => {
    const res = await request.post("/rpc/healthCheck", {
      data: { json: { __proto__: { admin: true } } },
    });
    expect(res.ok()).toBe(true);
  });

  test("constructor key in JSON body", async ({ request }) => {
    const res = await request.post("/rpc/healthCheck", {
      data: { json: { constructor: { prototype: { admin: true } } } },
    });
    expect(res.ok()).toBe(true);
  });
});

test.describe("Large payloads", () => {
  test("oversized body returns 400 or 413", async ({ request }) => {
    const large = { json: { smtpProfileId: "p1", from: "a@b.com", to: "c@d.com", subject: "x".repeat(50000) } };
    const res = await request.post("/rpc/email/send", {
      headers: { Authorization: "Bearer test-key" },
      data: large,
    });
    expect([400, 401, 413]).toContain(res.status());
  });

  test("deeply nested JSON handles gracefully", async ({ request }) => {
    let deep: any = {};
    let ptr = deep;
    for (let i = 0; i < 100; i++) {
      ptr[i] = {};
      ptr = ptr[i];
    }
    const res = await request.post("/rpc/healthCheck", {
      data: { json: deep },
    });
    expect(res.ok()).toBe(true);
  });
});

test.describe("Unicode and encoding attacks", () => {
  test("zero-width characters in subject", async ({ request }) => {
    const payloads = [
      "test\u200Bsubject",   // zero-width space
      "test\u200Csubject",   // zero-width non-joiner
      "test\u200Dsubject",   // zero-width joiner
      "test\uFEFFsubject",   // BOM
      "test\u0000subject",   // null byte
    ];
    for (const payload of payloads) {
      const res = await request.post("/rpc/email/send", {
        headers: { Authorization: "Bearer test-key" },
        data: { json: { smtpProfileId: "p1", from: "a@b.com", to: "c@d.com", subject: payload } },
      });
      expect([400, 401]).toContain(res.status());
    }
  });

  test("RTL override characters", async ({ request }) => {
    const payload = "test\u202Esam@evil.com\u202C@example.com";
    const res = await request.post("/rpc/email/send", {
      headers: { Authorization: "Bearer test-key" },
      data: { json: { smtpProfileId: "p1", from: payload, to: "c@d.com", subject: "test" } },
    });
    expect([400, 401]).toContain(res.status());
  });
});

test.describe("Header injection", () => {
  test("newline injection in subject", async ({ request }) => {
    const payloads = [
      "test\r\nX-Injected: true",
      "test\nX-Injected: true",
      "test\r\nSubject: injected",
    ];
    for (const payload of payloads) {
      const res = await request.post("/rpc/email/send", {
        headers: { Authorization: "Bearer test-key" },
        data: { json: { smtpProfileId: "p1", from: "a@b.com", to: "c@d.com", subject: payload } },
      });
      expect([400, 401]).toContain(res.status());
    }
  });
});

test.describe("IDOR attempts", () => {
  test("accessing other users data via IDOR", async ({ request }) => {
    const res = await request.post("/rpc/template/get", {
      data: { json: { id: "../user-data" } },
    });
    expect(res.status()).toBe(401);
  });

  test("accessing email with invalid UUID format", async ({ request }) => {
    const res = await request.post("/rpc/email/getStatus", {
      headers: { Authorization: "Bearer test-key" },
      data: { json: { id: "../../config" } },
    });
    expect([400, 401, 404]).toContain(res.status());
  });
});
