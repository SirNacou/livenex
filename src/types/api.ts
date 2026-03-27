import { z } from "zod";

// Request/Response envelope per architecture pattern
export const ApiResponse = <T extends z.ZodType>(dataSchema: T) =>
	z.object({
		ok: z.boolean(),
		data: dataSchema.optional(),
		error: z
			.object({
				code: z.string(),
				message: z.string(),
			})
			.optional(),
	});

// Auth schemas per D-01, D-06
export const SignupRequest = z.object({
	email: z.string().email("Invalid email"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain uppercase letter")
		.regex(/[0-9]/, "Password must contain number"),
	name: z.string().optional(),
});

export const SigninRequest = z.object({
	email: z.string().email("Invalid email"),
	password: z.string().min(1, "Password required"),
});

export const AuthResponse = z.object({
	user: z.object({
		id: z.string(),
		email: z.string(),
		name: z.string().nullable(),
	}),
});

export type SignupRequest = z.infer<typeof SignupRequest>;
export type SigninRequest = z.infer<typeof SigninRequest>;
export type AuthResponse = z.infer<typeof AuthResponse>;
