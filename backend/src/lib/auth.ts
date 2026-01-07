import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export type Env = {
	DB: D1Database;
	DISCORD_CLIENT_ID: string;
	DISCORD_CLIENT_SECRET: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
};

export function createAuth(env: Env) {
	const db = drizzle(env.DB, { schema });

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema: {
				user: schema.users,
				session: schema.sessions,
				account: schema.accounts,
				verification: schema.verifications,
			},
		}),
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		socialProviders: {
			discord: {
				clientId: env.DISCORD_CLIENT_ID,
				clientSecret: env.DISCORD_CLIENT_SECRET,
			},
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // 1 day
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;
