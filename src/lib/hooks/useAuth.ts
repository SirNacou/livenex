import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface User {
	id: string;
	email: string;
	name?: string | null;
}

export function useAuth() {
	const router = useRouter();
	const [session, setSession] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Load session on mount
	useEffect(() => {
		const loadSession = async () => {
			try {
				const res = await fetch("/api/auth/session");
				if (!res.ok) {
					setSession(null);
					return;
				}
				const data = await res.json();
				if (data.user) {
					setSession(data.user);
				}
			} catch (err) {
				console.error("Failed to load session", err);
				setSession(null);
			} finally {
				setIsLoading(false);
			}
		};

		loadSession();
	}, []);

	// Login function (per D-01)
	const login = async (email: string, password: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/auth/sign-in/email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email, password }),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || "Login failed");
			}

			const data = await res.json();
			setSession(data.user);
			// Navigate to dashboard per D-07
			await router.navigate({ to: "/dashboard" });
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "Login failed";
			setError(errorMsg);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// Signup function (per D-01)
	const signup = async (email: string, password: string, name?: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/auth/sign-up/email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email, password, name }),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || "Signup failed");
			}

			const data = await res.json();
			setSession(data.user);
			// Navigate to dashboard per D-07
			await router.navigate({ to: "/dashboard" });
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "Signup failed";
			setError(errorMsg);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// Logout function (per D-16)
	const logout = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/auth/sign-out", {
				method: "POST",
				credentials: "include",
			});

			if (!res.ok) {
				throw new Error("Logout failed");
			}

			setSession(null);
			// Navigate to login
			await router.navigate({ to: "/login" });
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "Logout failed";
			setError(errorMsg);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		user: session,
		isLoading,
		isAuthenticated: !!session,
		login,
		signup,
		logout,
		error,
	};
}
