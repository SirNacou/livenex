import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import TanStackQueryProvider from "./integrations/tanstack-query/root-provider";
import { authClient } from "./lib/auth-client";

export function Providers({ children }: { children: ReactNode }) {
	const router = useRouter();

	return (
		<TanStackQueryProvider>
			<AuthUIProviderTanstack
				authClient={authClient}
				navigate={(href) => router.navigate({ href })}
				replace={(href) => router.navigate({ href, replace: true })}
				Link={({ href, ...props }) => <Link to={href} {...props} />}
			>
				{children}
			</AuthUIProviderTanstack>
		</TanStackQueryProvider>
	);
}
