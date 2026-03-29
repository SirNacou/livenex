import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "#/components/ProtectedRoute";
import { useAuth } from "#/lib/hooks/useAuth";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<ProtectedRoute>
			<Dashboard />
		</ProtectedRoute>
	);
}

function Dashboard() {
	const { user, logout, isLoading } = useAuth();

	const handleLogout = async () => {
		try {
			await logout();
		} catch (err) {
			console.error("Logout error:", err);
		}
	};

	return (
		<div className="min-h-screen bg-foam">
			{/* Header */}
			<header className="bg-white shadow-sm border-b border-line">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
					<h1 className="text-2xl font-bold text-sea-ink">Livenex</h1>
					<nav className="flex items-center gap-4">
						<a
							href="/settings"
							className="text-sea-ink-soft hover:text-sea-ink"
						>
							Settings
						</a>
						<button
							type="button"
							onClick={handleLogout}
							disabled={isLoading}
							className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? "Logging out..." : "Logout"}
						</button>
					</nav>
				</div>
			</header>

			{/* Main content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Welcome section */}
					<div className="md:col-span-2">
						<div className="bg-white rounded-lg shadow-sm border border-line p-6">
							<h2 className="text-xl font-bold text-sea-ink mb-2">
								Welcome to Livenex
							</h2>
							<p className="text-gray-600 mb-4">
								{user ? (
									<>
										Signed in as{" "}
										<span className="font-medium">{user.email}</span>
										{user.name && <>, {user.name}</>}
									</>
								) : (
									"You are signed in"
								)}
							</p>
							<p className="text-gray-500 mb-6">
								Monitor uptime, manage API keys, and configure your private
								status pages.
							</p>
							<div className="space-y-2">
								<p className="text-sm text-gray-600">Quick start:</p>
								<ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
									<li>Create API keys in Settings → API Keys</li>
									<li>Use keys to add monitors via the API</li>
									<li>View incident history and metrics</li>
								</ul>
							</div>
						</div>
					</div>

					{/* Stats sidebar */}
					<div className="space-y-4">
						<div className="bg-white rounded-lg shadow-sm border border-line p-6">
							<h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
							<p className="text-2xl font-bold text-lagoon">All Good</p>
							<p className="text-xs text-gray-500 mt-2">No active incidents</p>
						</div>

						<div className="bg-white rounded-lg shadow-sm border border-line p-6">
							<h3 className="text-sm font-medium text-gray-700 mb-2">
								Monitors
							</h3>
							<p className="text-2xl font-bold text-sea-ink">0</p>
							<p className="text-xs text-gray-500 mt-2">Phase 2+</p>
						</div>
					</div>
				</div>

				{/* Settings placeholder */}
				<div className="mt-8 bg-white rounded-lg shadow-sm border border-line p-6">
					<h2 className="text-lg font-bold text-sea-ink mb-4">Next Steps</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<a
							href="/settings"
							className="block p-4 border border-dashed border-line rounded-lg hover:bg-foam transition-colors"
						>
							<p className="font-medium text-sea-ink">Manage API Keys</p>
							<p className="text-sm text-gray-600">
								Create and manage your API keys
							</p>
						</a>
						<div className="block p-4 border border-dashed border-line rounded-lg opacity-50">
							<p className="font-medium text-sea-ink">Add Monitors</p>
							<p className="text-sm text-gray-600">Phase 2: Coming soon</p>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
