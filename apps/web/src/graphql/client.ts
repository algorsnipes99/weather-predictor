import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({ uri: "/graphql" });

async function fetchToken(): Promise<string | null> {
  try {
    const res = await fetch("/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "demo", password: "demo" }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token ?? null;
  } catch {
    return null;
  }
}

let cachedToken: string | null = null;

const authLink = setContext(async (_, { headers }) => {
  if (!cachedToken) {
    cachedToken = await fetchToken();
  }
  return {
    headers: {
      ...headers,
      ...(cachedToken ? { authorization: `Bearer ${cachedToken}` } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
