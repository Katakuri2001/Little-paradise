import { expect, test } from "vitest";
import nextConfig from "../next.config.mjs";

test("next.config.mjs exports headers function", () => {
  const config = nextConfig as any;
  expect(typeof config.headers).toBe("function");
});

test("security headers are configured", async () => {
  const config = nextConfig as any;
  const headers: any = await config.headers();
  const headerMap: Record<string, string> = {};
  headers.forEach((h: any) => {
    h.headers.forEach((header: any) => {
      headerMap[header.key] = header.value;
    });
  });

  expect(headerMap["Content-Security-Policy"]).toBeDefined();
  expect(headerMap["X-Content-Type-Options"]).toBe("nosniff");
  expect(headerMap["Referrer-Policy"]).toBeDefined();
  expect(headerMap["Permissions-Policy"]).toBeDefined();
});
