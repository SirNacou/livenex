import { useState } from "react";
import { toast } from "sonner";

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

interface ApiKeyListProps {
	keys: ApiKey[];
	loading: boolean;
	onRefresh: () => void;
}

/**
 * List view for API keys (D-23)
 * Shows: name, created date, expiration, last used, scopes, permission level
 * Actions: copy, regenerate, revoke
 */
export function ApiKeyList({ keys, loading, onRefresh }: ApiKeyListProps) {
	const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
	const [revokingId, setRevokingId] = useState<string | null>(null);
	const [showRevokeConfirm, setShowRevokeConfirm] = useState<string | null>(
		null,
	);

	const handleRegenerateKey = async (keyId: string) => {
		if (
			!confirm("Are you sure? The old secret will stop working immediately.")
		) {
			return;
		}

		setRegeneratingId(keyId);
		try {
			const response = await fetch(`/api/keys/${keyId}/regenerate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			if (!response.ok) {
				const error = await response.json();
				toast.error(error.message || "Failed to regenerate key");
				return;
			}

			const result = await response.json();
			if (result.data?.secret) {
				// Show secret in a toast or modal
				await navigator.clipboard.writeText(result.data.secret);
				toast.success("New secret copied to clipboard");
			}
			onRefresh();
		} catch (error) {
			toast.error("Failed to regenerate key");
			console.error(error);
		} finally {
			setRegeneratingId(null);
		}
	};

	const handleRevokeKey = async (keyId: string) => {
		setRevokingId(keyId);
		try {
			const response = await fetch(`/api/keys/${keyId}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			if (!response.ok) {
				const error = await response.json();
				toast.error(error.message || "Failed to revoke key");
				return;
			}

			toast.success("API key revoked successfully");
			setShowRevokeConfirm(null);
			onRefresh();
		} catch (error) {
			toast.error("Failed to revoke key");
			console.error(error);
		} finally {
			setRevokingId(null);
		}
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "Never";
		const date = new Date(dateString);
		return date.toLocaleDateString() + " " + date.toLocaleTimeString();
	};

	if (loading) {
		return (
			<div className="text-center py-8 text-gray-500">Loading keys...</div>
		);
	}

	if (keys.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				No API keys yet. Create one to get started.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{keys.map((key) => (
				<div
					key={key.id}
					className={`border rounded-lg p-4 ${
						key.isRevoked ? "bg-red-50 border-red-200" : "bg-white"
					}`}
				>
					<div className="flex justify-between items-start mb-3">
						<div>
							<h3 className="font-semibold text-gray-900">{key.name}</h3>
							<div className="flex gap-2 mt-1">
								<span
									className={`text-xs px-2 py-1 rounded ${
										key.permission === "read"
											? "bg-blue-100 text-blue-800"
											: "bg-purple-100 text-purple-800"
									}`}
								>
									{key.permission === "read" ? "Read-only" : "Read & Write"}
								</span>
								{key.isRevoked && (
									<span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
										Revoked
									</span>
								)}
								{key.isExpired && !key.isRevoked && (
									<span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
										Expired
									</span>
								)}
							</div>
						</div>

						{!key.isRevoked && (
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setShowRevokeConfirm(key.id)}
									className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
								>
									Revoke
								</button>
								<button
									type="button"
									onClick={() => handleRegenerateKey(key.id)}
									disabled={regeneratingId === key.id}
									className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition disabled:opacity-50"
								>
									{regeneratingId === key.id ? "Regenerating..." : "Regenerate"}
								</button>
							</div>
						)}
					</div>

					<div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
						<div>
							<span className="text-xs text-gray-500">Created</span>
							<p className="font-mono text-xs">{formatDate(key.createdAt)}</p>
						</div>
						<div>
							<span className="text-xs text-gray-500">Expires</span>
							<p className="font-mono text-xs">
								{key.expiresAt ? formatDate(key.expiresAt) : "Never"}
							</p>
						</div>
						<div className="col-span-2">
							<span className="text-xs text-gray-500">Last Used</span>
							<p className="font-mono text-xs">{formatDate(key.lastUsedAt)}</p>
						</div>
					</div>

					{key.scopes.length > 0 && (
						<div className="mt-3 pt-3 border-t">
							<span className="text-xs text-gray-500">Scopes</span>
							<div className="flex flex-wrap gap-1 mt-1">
								{key.scopes.map((scope) => (
									<span
										key={scope}
										className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
									>
										{scope}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Revoke confirmation dialog */}
					{showRevokeConfirm === key.id && (
						<div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
							<p className="text-sm text-red-800 mb-2">
								Are you sure you want to revoke this key? It will stop working
								immediately.
							</p>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => handleRevokeKey(key.id)}
									disabled={revokingId === key.id}
									className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition disabled:opacity-50"
								>
									{revokingId === key.id ? "Revoking..." : "Yes, Revoke"}
								</button>
								<button
									type="button"
									onClick={() => setShowRevokeConfirm(null)}
									disabled={revokingId === key.id}
									className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition disabled:opacity-50"
								>
									Cancel
								</button>
							</div>
						</div>
					)}
				</div>
			))}
		</div>
	);
}
