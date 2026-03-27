import { useCallback, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { CreateApiKeyDialog } from "#/components/ApiKeyDialog";
import { ApiKeyList } from "#/components/ApiKeyList";
import { ProtectedRoute } from "#/components/ProtectedRoute";

interface ApiKey {
	id: string;
	name: string;
	permission: "read" | "read_write";
	expiresAt: string | null;
	lastUsedAt: string | null;
	revokedAt: string | null;
	createdAt: string;
	scopes: string[];
	isExpired: boolean;
	isRevoked: boolean;
}

/**
 * API Keys Management Page
 * Allows user to:
 * - Create new API keys (D-24: single dialog form)
 * - View all keys with metadata (D-23)
 * - Regenerate keys in-place (D-21)
 * - Revoke keys (D-25/D-26)
 * Per D-27: Toast notifications for all operations
 */
export function ApiKeysPage() {
	const [keys, setKeys] = useState<ApiKey[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);

	// Load keys on mount
	const loadKeys = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/keys", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			if (!response.ok) {
				console.error("Failed to load API keys");
				return;
			}

			const result = await response.json();
			setKeys(result.data || []);
		} catch (error) {
			console.error("Error loading API keys:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadKeys();
	}, [loadKeys]);

	const handleKeyCreated = () => {
		loadKeys();
		setDialogOpen(false);
	};

	return (
		<ProtectedRoute>
			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<div className="bg-white border-b">
					<div className="max-w-4xl mx-auto px-4 py-8">
						<div className="flex justify-between items-center">
							<div>
								<h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
								<p className="text-gray-600 mt-2">
									Manage API keys for automation and integrations
								</p>
							</div>
							<button
								type="button"
								onClick={() => setDialogOpen(true)}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
							>
								+ Create Key
							</button>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="max-w-4xl mx-auto px-4 py-8">
					<ApiKeyList keys={keys} loading={loading} onRefresh={loadKeys} />

					{/* Info box */}
					<div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<h3 className="font-semibold text-blue-900 mb-2">
							How to use API keys
						</h3>
						<p className="text-sm text-blue-800">
							Include your API key in the Authorization header of API requests:
						</p>
						<code className="block mt-2 p-2 bg-blue-100 text-blue-900 text-sm rounded">
							Authorization: Bearer &lt;your-api-key-secret&gt;
						</code>
					</div>
				</div>

				{/* Create Key Dialog */}
				<CreateApiKeyDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					onKeyCreated={handleKeyCreated}
				/>

				{/* Toast notifications */}
				<Toaster />
			</div>
		</ProtectedRoute>
	);
}
