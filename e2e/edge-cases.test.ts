import { expect, test } from "@playwright/test";

test.describe("HTTP method enforcement", () => {
  test("GET on RPC endpoint returns non-200", async ({ request }) => {
    const res = await request.get("/rpc/email/send");
    expect(res.ok()).toBe(false);
  });

  test("PUT on RPC endpoint returns non-200", async ({ request }) => {
    const res = await request.put("/rpc/email/send");
    expect(res.ok()).toBe(false);
  });

  test("DELETE on RPC endpoint returns non-200", async ({ request }) => {
    const res = await request.delete("/rpc/email/send");
    expect(res.ok()).toBe(false);
  });
});

test.describe("Path traversal attempts", () => {
  test("double slashes return non-200", async ({ request }) => {
    const res = await request.post("http://localhost:3000//rpc//email/send", {
      data: { json: {} },
    });
    expect(res.ok()).toBe(false);
  });

  test("path traversal returns 404", async ({ request }) => {
    const res = await request.post("/rpc/../email/send", {
      data: { json: {} },
    });
    expect(res.status()).toBe(404);
  });
});

test.describe("Content-Type handling", () => {
  test("text/plain content type works for healthCheck", async ({ request }) => {
    const res = await request.post("/rpc/healthCheck", {
      headers: { "Content-Type": "text/plain" },
      data: "{}",
    });
    expect(res.ok()).toBe(true);
  });

  test("no content type returns 200 for valid request", async ({ request }) => {
    const res = await request.post("/rpc/healthCheck", {
      data: { json: {} },
    });
    expect(res.ok()).toBe(true);
  });
});

test.describe("Request body edge cases", () => {
  test("empty body returns 200 for healthCheck", async ({ request }) => {
    const res = await request.post("/rpc/healthCheck", {
      headers: { "Content-Type": "application/json" },
      data: "",
    });
    expect(res.ok()).toBe(true);
  });

  test("null json body returns 200 for healthCheck", async ({ request }) => {
    const res = await request.post("/rpc/healthCheck", {
      data: { json: null },
    });
    expect(res.ok()).toBe(true);
  });
});

test.describe("API key format handling", () => {
  test("empty Bearer token returns 401", async ({ request }) => {
    const res = await request.post("/rpc/email/send", {
      headers: { Authorization: "Bearer " },
      data: { json: {} },
    });
    expect(res.status()).toBe(401);
  });

  test("malformed auth header returns 401", async ({ request }) => {
    const res = await request.post("/rpc/email/send", {
      headers: { Authorization: "Basic dGVzdDpwYXNz" },
      data: { json: {} },
    });
    expect(res.status()).toBe(401);
  });

  test("no auth header returns 401", async ({ request }) => {
    const res = await request.post("/rpc/email/send", {
      data: { json: {} },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("Public endpoints availability", () => {
  test("healthCheck always returns 200", async ({ request }) => {
    const res = await request.post("/rpc/healthCheck", { data: { json: {} } });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.json).toBe("OK");
  });

  test("canSignUp always returns boolean", async ({ request }) => {
    const res = await request.post("/rpc/canSignUp", { data: { json: {} } });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(typeof body.json).toBe("boolean");
  });
});

test.describe("Non-existent procedures", () => {
  test("unknown procedure returns 404", async ({ request }) => {
    const res = await request.post("/rpc/nonexistent", { data: { json: {} } });
    expect(res.status()).toBe(404);
  });

  test("unknown nested procedure returns 404", async ({ request }) => {
    const res = await request.post("/rpc/email/nonexistent", {
      data: { json: {} },
    });
    expect(res.status()).toBe(404);
  });
});
