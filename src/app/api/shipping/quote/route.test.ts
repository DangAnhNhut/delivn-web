import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/shipping/quote", () => {
  it("returns UNAVAILABLE by default when no carrier is configured", async () => {
    const request = new Request("http://localhost/api/shipping/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subtotalVnd: 173_000,
        address: "123 Đường ABC, Phường Bến Nghé, Thành phố Hồ Chí Minh, Việt Nam",
        provinceCode: "79",
        communeCode: "26740",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("UNAVAILABLE");
    expect(data.reason).toContain("Phí vận chuyển cần được xác định");
  });

  it("handles malformed JSON payload cleanly", async () => {
    const request = new Request("http://localhost/api/shipping/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.status).toBe("ERROR");
  });
});
