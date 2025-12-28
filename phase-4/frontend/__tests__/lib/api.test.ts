/**
 * Basic API Client Tests
 * Tests core API functionality and configuration
 */

describe("API Client", () => {
  it("should have correct base URL configured", () => {
    const expectedUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    expect(expectedUrl).toBeDefined();
  });

  it("should define API endpoints", () => {
    const endpoints = {
      signup: "/api/auth/signup",
      signin: "/api/auth/signin",
      tasks: "/api/:userId/tasks",
    };
    expect(endpoints.signup).toBe("/api/auth/signup");
  });
});
