import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: import.meta.env.DEV ? "http://localhost:8787" : "",
});

export const { signIn, signOut, useSession } = authClient;
