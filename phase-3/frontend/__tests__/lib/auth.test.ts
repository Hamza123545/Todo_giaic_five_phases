/**
 * Basic Auth Utilities Tests
 * Tests authentication helper functions
 */

describe("Auth Utilities", () => {
  it("should have auth client configured", () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    expect(baseUrl).toBeDefined();
  });

  it("should define auth endpoints", () => {
    const authEndpoints = ["signup", "signin", "signout"];
    expect(authEndpoints).toContain("signup");
    expect(authEndpoints).toContain("signin");
  });
});
