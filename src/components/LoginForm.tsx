"use client";

import { useState } from "react";
import { useAuth } from "#/lib/hooks/useAuth";

interface LoginFormProps {
	isSignup?: boolean;
}

export function LoginForm({ isSignup = false }: LoginFormProps) {
	const { login, signup, isLoading, error } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setValidationError(null);

		// Validation
		if (!email.trim()) {
			setValidationError("Email is required");
			return;
		}
		if (!password.trim()) {
			setValidationError("Password is required");
			return;
		}
		if (password.length < 8) {
			setValidationError("Password must be at least 8 characters");
			return;
		}
		if (isSignup && !name.trim()) {
			setValidationError("Name is required");
			return;
		}

		try {
			if (isSignup) {
				await signup(email, password, name);
			} else {
				await login(email, password);
			}
		} catch (err) {
			// Error is already set by the auth hook
			console.error("Form submission error:", err);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
			{/* Error messages */}
			{(error || validationError) && (
				<div className="bg-red-50 border border-red-200 rounded-md p-3">
					<p className="text-sm text-red-700">{validationError || error}</p>
				</div>
			)}

			{/* Name field (signup only) */}
			{isSignup && (
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Name
					</label>
					<input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
						placeholder="Your name"
						disabled={isLoading}
					/>
				</div>
			)}

			{/* Email field */}
			<div>
				<label
					htmlFor="email"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Email
				</label>
				<input
					id="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
					placeholder="you@example.com"
					disabled={isLoading}
				/>
			</div>

			{/* Password field */}
			<div>
				<label
					htmlFor="password"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Password
				</label>
				<input
					id="password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
					placeholder="••••••••"
					disabled={isLoading}
				/>
				{!isSignup && (
					<p className="text-xs text-gray-500 mt-1">
						Forgot password? Not available yet.
					</p>
				)}
			</div>

			{/* Submit button */}
			<button
				type="submit"
				disabled={isLoading}
				className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? "Loading..." : isSignup ? "Sign Up" : "Sign In"}
			</button>

			{/* Link to other form */}
			<p className="text-center text-sm text-gray-600">
				{isSignup ? (
					<>
						Already have an account?{" "}
						<a href="/login" className="text-primary hover:underline">
							Sign In
						</a>
					</>
				) : (
					<>
						Don't have an account?{" "}
						<a href="/signup" className="text-primary hover:underline">
							Sign Up
						</a>
					</>
				)}
			</p>
		</form>
	);
}
