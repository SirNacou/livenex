import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "#/components/LoginForm";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	return (
		<div className="min-h-screen bg-foam flex items-center justify-center px-4 py-8">
			<div className="w-full max-w-md">
				<div className="bg-white rounded-lg shadow-sm border border-line p-8">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-sea-ink mb-2">Livenex</h1>
						<p className="text-gray-600">Sign in to your account</p>
					</div>

					<LoginForm isSignup={false} />

					<div className="mt-6 pt-6 border-t border-line text-center">
						<p className="text-sm text-gray-500">
							This is a private single-user dashboard.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
