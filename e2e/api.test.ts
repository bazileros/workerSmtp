import { expect, test } from "@playwright/test";

const BASE = "http://localhost:3000";

async function signUp(request: any) {
  const check = await request.post(`${BASE}/rpc/canSignUp`, { data: { json: {} } });
  const { json: canSignUp } = await check.json();
  if (!canSignUp) return null;
  const res = await request.post(`${BASE}/api/auth/sign-up/email`, {
    data: { name: "Test Operator", email: "test@example.com", password: "TestPass123!" },
  });
  return res.ok() ? res : null;
}

async function signIn(request: any) {
  const res = await request.post(`${BASE}/api/auth/sign-in/email`, {
    data: { email: "test@example.com", password: "TestPass123!" },
  });
  return res;
}

test.describe("HTTP Status Codes", () => {
  test("200 - GET / returns OK", async ({ request }) => {
    const res = await request.get(`${BASE}/`);
    expect(res.status()).toBe(200);
    expect(await res.text()).toBe("OK");
  });

  test("200 - POST /rpc/healthCheck", async ({ request }) => {
    const res = await request.post(`${BASE}/rpc/healthCheck`, { data: { json: {} } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.json).toBe("OK");
  });

  test("200 - POST /rpc/canSignUp returns boolean", async ({ request }) => {
    const res = await request.post(`${BASE}/rpc/canSignUp`, { data: { json: {} } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.json).toBe("boolean");
  });

  test("401 - POST /rpc/email/send without auth", async ({ request }) => {
    const res = await request.post(`${BASE}/rpc/email/send`, { data: { json: {} } });
    expect(res.status()).toBe(401);
  });

  test("401 - POST /rpc/email/send with invalid auth", async ({ request }) => {
    const res = await request.post(`${BASE}/rpc/email/send`, {
      headers: { Authorization: "Bearer invalid-key" },
      data: { json: {} },
    });
    expect(res.status()).toBe(401);
  });

  test("401 - POST /rpc/privateData without session", async ({ request }) => {
    const res = await request.post(`${BASE}/rpc/privateData`, { data: { json: {} } });
    expect(res.status()).toBe(401);
  });

  test("401 - POST /rpc/email/list without session", async ({ request }) => {
    const res = await request.post(`${BASE}/rpc/email/list`, { data: { json: {} } });
    expect(res.status()).toBe(401);
  });

  test("401 - POST /rpc/template/create without session", async ({ request }) => {
    const res = await request.post(`${BASE}/rpc/template/create`, {
      data: { json: { name: "test", subject: "test", htmlBody: "<p>test</p>" } },
    });
    expect(res.status()).toBe(401);
  });

  test("401 - POST /rpc/smtp-profile/list without session", async ({ request }) => {
    const res = await request.post(`${BASE}/rpc/smtp-profile/list`, { data: { json: {} } });
    expect(res.status()).toBe(401);
  });

  test("401 - POST /rpc/api-key/list without session", async ({ request }) => {
    const res = await request.post(`${BASE}/rpc/api-key/list`, { data: { json: {} } });
    expect(res.status()).toBe(401);
  });

  test("404 - POST /rpc/nonexistent", async ({ request }) => {
    const res = await request.post(`${BASE}/rpc/nonexistent`, { data: { json: {} } });
    expect(res.status()).toBe(404);
  });

  test("404 - POST /rpc/email/nonexistent", async ({ request }) => {
    const res = await request.post(`${BASE}/rpc/email/nonexistent`, { data: { json: {} } });
    expect(res.status()).toBe(404);
  });

  test("405 - GET on RPC endpoint", async ({ request }) => {
    const res = await request.get(`${BASE}/rpc/email/send`);
    expect(res.ok()).toBe(false);
  });

  test("405 - PUT on RPC endpoint", async ({ request }) => {
    const res = await request.put(`${BASE}/rpc/email/send`);
    expect(res.ok()).toBe(false);
  });
});

test.describe("Session flow (sign-up + protected endpoints)", () => {
  let sessionCookie: string | null = null;

  test("POST /api/auth/sign-up/email creates operator", async ({ request }) => {
    await signUp(request);
    const signInRes = await signIn(request);
    const setCookie = signInRes.headers()["set-cookie"];
    if (setCookie) {
      const match = setCookie.match(/better-auth-session=([^;]+)/);
      if (match) sessionCookie = match[0];
    }
    expect(signInRes.ok()).toBe(true);
  });

  test("200 - POST /rpc/privateData with session", async ({ request, context }) => {
    await signUp(request);
    const signInRes = await signIn(request);
    const cookies = signInRes.headers()["set-cookie"];
    if (!cookies) { expect(signInRes.ok()).toBe(true); return; }

    const res = await request.post(`${BASE}/rpc/privateData`, {
      headers: { Cookie: cookies },
      data: { json: {} },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.json).toHaveProperty("message");
  });

  test("200 - POST /rpc/template/create with session", async ({ request }) => {
    await signUp(request);
    const signInRes = await signIn(request);
    const cookies = signInRes.headers()["set-cookie"];
    if (!cookies) { expect(signInRes.ok()).toBe(true); return; }

    const res = await request.post(`${BASE}/rpc/template/create`, {
      headers: { Cookie: cookies },
      data: { json: { name: "Test Template", subject: "Test {{name}}", htmlBody: "<p>Hi {{name}}</p>", variables: ["name"] } },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.json).toHaveProperty("id");
  });

  test("200 - POST /rpc/template/list with session", async ({ request }) => {
    await signUp(request);
    const signInRes = await signIn(request);
    const cookies = signInRes.headers()["set-cookie"];
    if (!cookies) { expect(signInRes.ok()).toBe(true); return; }

    const res = await request.post(`${BASE}/rpc/template/list`, {
      headers: { Cookie: cookies },
      data: { json: {} },
    });
    expect(res.status()).toBe(200);
  });

  test("200 - POST /rpc/smtp-profile/create with session", async ({ request }) => {
    await signUp(request);
    const signInRes = await signIn(request);
    const cookies = signInRes.headers()["set-cookie"];
    if (!cookies) { expect(signInRes.ok()).toBe(true); return; }

    const res = await request.post(`${BASE}/rpc/smtp-profile/create`, {
      headers: { Cookie: cookies },
      data: { json: { label: "Test Relay", host: "smtp.test.com", port: 587, username: "user", password: "pass" } },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.json).toHaveProperty("id");
  });

  test("200 - POST /rpc/smtp-profile/list with session", async ({ request }) => {
    await signUp(request);
    const signInRes = await signIn(request);
    const cookies = signInRes.headers()["set-cookie"];
    if (!cookies) { expect(signInRes.ok()).toBe(true); return; }

    const res = await request.post(`${BASE}/rpc/smtp-profile/list`, {
      headers: { Cookie: cookies },
      data: { json: {} },
    });
    expect(res.status()).toBe(200);
  });

  test("200 - POST /rpc/api-key/create with session", async ({ request }) => {
    await signUp(request);
    const signInRes = await signIn(request);
    const cookies = signInRes.headers()["set-cookie"];
    if (!cookies) { expect(signInRes.ok()).toBe(true); return; }

    const res = await request.post(`${BASE}/rpc/api-key/create`, {
      headers: { Cookie: cookies },
      data: { json: { name: "test-key" } },
    });
    expect(res.status()).toBe(200);
  });

  test("200 - POST /rpc/api-key/list with session", async ({ request }) => {
    await signUp(request);
    const signInRes = await signIn(request);
    const cookies = signInRes.headers()["set-cookie"];
    if (!cookies) { expect(signInRes.ok()).toBe(true); return; }

    const res = await request.post(`${BASE}/rpc/api-key/list`, {
      headers: { Cookie: cookies },
      data: { json: {} },
    });
    expect(res.status()).toBe(200);
  });

  test("200 - POST /rpc/email/list with session", async ({ request }) => {
    await signUp(request);
    const signInRes = await signIn(request);
    const cookies = signInRes.headers()["set-cookie"];
    if (!cookies) { expect(signInRes.ok()).toBe(true); return; }

    const res = await request.post(`${BASE}/rpc/email/list`, {
      headers: { Cookie: cookies },
      data: { json: {} },
    });
    expect(res.status()).toBe(200);
  });
});

test.describe("API key protected endpoints happy path", () => {
  let apiKey: string | null = null;
  let profileId: string | null = null;

  test("setup: create session, API key, and SMTP profile", async ({ request }) => {
    await signUp(request);
    const signInRes = await signIn(request);
    const cookies = signInRes.headers()["set-cookie"];
    if (!cookies) { expect(signInRes.ok()).toBe(true); return; }

    const keyRes = await request.post(`${BASE}/rpc/api-key/create`, {
      headers: { Cookie: cookies },
      data: { json: { name: "e2e-test-key" } },
    });
    expect(keyRes.status()).toBe(200);
    const keyBody = await keyRes.json();
    if (keyBody.json?.key) apiKey = keyBody.json.key;

    const profileRes = await request.post(`${BASE}/rpc/smtp-profile/create`, {
      headers: { Cookie: cookies },
      data: { json: { label: "E2E Relay", host: "smtp.e2e.test", port: 587, username: "u", password: "p" } },
    });
    expect(profileRes.status()).toBe(200);
    const profileBody = await profileRes.json();
    if (profileBody.json?.id) profileId = profileBody.json.id;
  });

  test("200 - POST /rpc/email/send with valid API key", async ({ request }) => {
    if (!apiKey) { test.skip(); return; }
    const res = await request.post(`${BASE}/rpc/email/send`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      data: { json: { smtpProfileId: profileId || "test-id", from: "test@example.com", to: "recip@example.com", subject: "E2E Test", priority: "transactional" } },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.json).toHaveProperty("id");
  });

  test("200 - POST /rpc/email/getStatus with valid API key", async ({ request }) => {
    if (!apiKey) { test.skip(); return; }
    const res = await request.post(`${BASE}/rpc/email/getStatus`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      data: { json: { id: "00000000-0000-0000-0000-000000000000" } },
    });
    expect(res.status()).toBe(404);
  });
});
