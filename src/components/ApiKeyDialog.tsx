import { useState } from "react";
import { toast } from "sonner";

interface CreateApiKeyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onKeyCreated: () => void;
}

/**
 * Dialog for creating new API keys
 * Per D-24: Single-dialog form (not multi-step wizard)
 * Per D-22: Display secret once, then hide
 * Per D-27: Toast notifications for success
 */
export function CreateApiKeyDialog({
	open,
	onOpenChange,
	onKeyCreated,
}: CreateApiKeyDialogProps) {
	const [loading, setLoading] = useState(false);
	const [secret, setSecret] = useState<string | null>(null);
	const [showSecret, setShowSecret] = useState(false);
	const [copied, setCopied] = useState(false);

	// Form state
	const [name, setName] = useState("");
	const [permission, setPermission] = useState<"read" | "read_write">("read");
	const [scopes, setScopes] = useState<string[]>([]);
	const [expiresAt, setExpiresAt] = useState<string>("");

	const handleCreateKey = async () => {
		if (!name.trim()) {
			toast.error("Key name is required");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch("/api/keys", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					name: name.trim(),
					permission,
					scopes: scopes.length > 0 ? scopes : undefined,
					expiresAt: expiresAt || undefined,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				toast.error(error.message || "Failed to create API key");
				return;
			}

			const result = await response.json();
			if (result.data?.secret) {
				setSecret(result.data.secret);
				setShowSecret(true);
				toast.success("API key created successfully");
			}
		} catch (error) {
			toast.error("Failed to create API key");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const handleCopySecret = async () => {
		if (secret) {
			try {
				await navigator.clipboard.writeText(secret);
				setCopied(true);
				toast.success("Secret copied to clipboard");
				setTimeout(() => setCopied(false), 2000);
			} catch (error) {
				toast.error("Failed to copy secret");
			}
		}
	};

	const handleClose = () => {
		// Reset form when closing
		if (secret) {
			setSecret(null);
			setShowSecret(false);
		}
		setName("");
		setPermission("read");
		setScopes([]);
		setExpiresAt("");
		setCopied(false);

		if (!secret) {
			// Only trigger callback if key was created
			onOpenChange(false);
		} else {
			// Just close the secret display
			onOpenChange(false);
			onKeyCreated();
		}
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
			<div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
				<h2 className="text-lg font-semibold mb-2">Create API Key</h2>
				<p className="text-sm text-gray-500 mb-6">
					{secret
						? "Your API key has been created. Copy it now — you won't see it again."
						: "Generate a new API key for automation and integration."}
				</p>

				{secret && showSecret ? (
					// Secret Display (D-22: shown once)
					<div className="space-y-4">
						<div className="p-4 bg-slate-50 border border-slate-200 rounded">
							<label className="text-xs text-gray-500">API Secret</label>
							<div className="flex items-center gap-2 mt-2">
								<code className="flex-1 font-mono text-sm break-all text-gray-800">
									{secret}
								</code>
								<button
									type="button"
									onClick={handleCopySecret}
									className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition"
								>
									{copied ? "Copied!" : "Copy"}
								</button>
							</div>
						</div>

						<div className="bg-amber-50 border border-amber-200 rounded p-3">
							<p className="text-xs text-amber-800">
								<strong>⚠️ Important:</strong> Save this secret somewhere safe.
								You won't be able to see it again.
							</p>
						</div>

						<button
							type="button"
							onClick={handleClose}
							className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
						>
							Done
						</button>
					</div>
				) : (
					// Form (D-28: user-defined name, D-19: permissions, D-20: expiration)
					<div className="space-y-4">
						<div>
							<label
								htmlFor="key-name"
								className="block text-sm font-medium mb-2"
							>
								Key Name
							</label>
							<input
								id="key-name"
								type="text"
								placeholder="e.g., GitHub Webhook Monitor"
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={loading}
								className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label
								htmlFor="permission"
								className="block text-sm font-medium mb-2"
							>
								Permission Level
							</label>
							<select
								id="permission"
								value={permission}
								onChange={(e) =>
									setPermission(e.target.value as "read" | "read_write")
								}
								disabled={loading}
								className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="read">Read-only</option>
								<option value="read_write">Read & Write</option>
							</select>
						</div>

						<div>
							<label
								htmlFor="expiration"
								className="block text-sm font-medium mb-2"
							>
								Expiration (optional, defaults to 90 days)
							</label>
							<input
								id="expiration"
								type="datetime-local"
								value={expiresAt}
								onChange={(e) => setExpiresAt(e.target.value)}
								disabled={loading}
								className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">
								Scopes (optional)
							</label>
							<p className="text-xs text-gray-500 mb-2">
								Select which monitor groups this key can access. Leave empty for
								all.
							</p>
							<div className="space-y-2">
								{/* Scopes will be populated from monitor tags in Phase 2 */}
								<div className="text-xs text-gray-400">
									(Scopes available after monitors are created)
								</div>
							</div>
						</div>

						<div className="flex gap-2 pt-4">
							<button
								type="button"
								onClick={handleCreateKey}
								disabled={loading || !name.trim()}
								className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
							>
								{loading ? "Creating..." : "Create Key"}
							</button>
							<button
								type="button"
								onClick={handleClose}
								disabled={loading}
								className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition"
							>
								Cancel
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
