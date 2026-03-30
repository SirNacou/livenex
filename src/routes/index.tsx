import { getTreaty } from "#/server/get-treaty"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App,
  loader: async () => {
    const r = await getTreaty().get()
    return r.data
  }
 });

function App() {
  const data = Route.useLoaderData()

  const {data: message} = useQuery({
    queryKey: ["message"],
    queryFn: async () => {
      const r = await getTreaty().get()
      return r.data
    }
  })
	return (
		<div>
			<h1>Welcome to the app!</h1>
      <p>Data from loader: {data}</p>
      <p>Data from query: {message}</p>
      <p>Try navigating to <a href="/auth/sign-in">/auth/sign-in</a> or <a href="/account">/account</a></p>
		</div>
	);
}
