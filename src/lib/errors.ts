export class AppError extends Error {
	constructor(
		public code: string,
		message: string,
		public statusCode: number = 500,
		public details?: unknown,
	) {
		super(message);
		this.name = "AppError";
	}
}

export class ValidationError extends AppError {
	constructor(message: string, details?: unknown) {
		super("VALIDATION_ERROR", message, 400, details);
		this.name = "ValidationError";
	}
}

export class AuthenticationError extends AppError {
	constructor(message: string = "Authentication failed") {
		super("AUTHENTICATION_ERROR", message, 401);
		this.name = "AuthenticationError";
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = "Resource not found") {
		super("NOT_FOUND", message, 404);
		this.name = "NotFoundError";
	}
}

export class PermissionError extends AppError {
	constructor(message: string = "Permission denied") {
		super("PERMISSION_DENIED", message, 403);
		this.name = "PermissionError";
	}
}
