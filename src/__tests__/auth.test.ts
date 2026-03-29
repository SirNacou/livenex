import { describe, expect, it } from "vitest";
import { API_KEY_CONFIG, SESSION_CONFIG } from "#/lib/constants";
import { AppError, AuthenticationError, ValidationError } from "#/lib/errors";
import { getCurrentUser } from "#/lib/middleware/auth";
import { SigninRequest, SignupRequest } from "#/types/api";

describe("Authentication Middleware", () => {
	describe("getCurrentUser", () => {
		it("should throw AuthenticationError when no session", async () => {
			try {
				await getCurrentUser(undefined);
				expect.fail("Should have thrown AuthenticationError");
			} catch (err) {
				expect(err).toBeInstanceOf(AuthenticationError);
			}
		});

		it("should throw AuthenticationError for invalid cookie", async () => {
			try {
				await getCurrentUser("invalid-cookie-value");
				expect.fail("Should have thrown AuthenticationError");
			} catch (err) {
				expect(err).toBeInstanceOf(AuthenticationError);
			}
		});
	});
});

describe("Password Validation", () => {
	it("should validate passwords with required complexity", () => {
		// Should fail: no uppercase
		expect(() =>
			SignupRequest.parse({
				email: "test@example.com",
				password: "lowercase123",
			}),
		).toThrow();

		// Should fail: no number
		expect(() =>
			SignupRequest.parse({
				email: "test@example.com",
				password: "UpperCase",
			}),
		).toThrow();

		// Should fail: too short
		expect(() =>
			SignupRequest.parse({
				email: "test@example.com",
				password: "Short1",
			}),
		).toThrow();

		// Should pass
		expect(() =>
			SignupRequest.parse({
				email: "test@example.com",
				password: "ValidPass123",
			}),
		).not.toThrow();
	});
});

describe("Email Validation", () => {
	it("should validate email format", () => {
		// Should fail: invalid email
		expect(() =>
			SigninRequest.parse({
				email: "not-an-email",
				password: "password",
			}),
		).toThrow();

		// Should pass
		expect(() =>
			SigninRequest.parse({
				email: "test@example.com",
				password: "password",
			}),
		).not.toThrow();
	});
});

describe("Session Configuration", () => {
	it("should have correct session settings", () => {
		expect(SESSION_CONFIG.expirationDays).toBe(30);
		expect(SESSION_CONFIG.sameSite).toBe("strict");
		expect(SESSION_CONFIG.httpOnly).toBe(true);
		// secure should be false in dev
		expect(SESSION_CONFIG.secure).toBe(false);
	});

	it("should have correct API key settings", () => {
		expect(API_KEY_CONFIG.defaultExpirationDays).toBe(90);
		expect(API_KEY_CONFIG.minSecretLength).toBe(32);
		expect(API_KEY_CONFIG.maxNameLength).toBe(255);
	});
});

describe("Error Classes", () => {
	it("should create proper error instances", () => {
		const appErr = new AppError("TEST", "Test message", 500);
		expect(appErr.code).toBe("TEST");
		expect(appErr.statusCode).toBe(500);
		expect(appErr.message).toBe("Test message");

		const valErr = new ValidationError("Invalid input");
		expect(valErr.code).toBe("VALIDATION_ERROR");
		expect(valErr.statusCode).toBe(400);

		const authErr = new AuthenticationError("Not authenticated");
		expect(authErr.code).toBe("AUTHENTICATION_ERROR");
		expect(authErr.statusCode).toBe(401);
	});
});
