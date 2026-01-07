import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../App";

// Mock better-auth
vi.mock("../lib/auth", () => ({
	useSession: () => ({ data: null, isPending: false }),
	signIn: { social: vi.fn() },
	signOut: vi.fn(),
}));

describe("App", () => {
	it("renders login page on /login", () => {
		window.history.pushState({}, "", "/login");
		render(<App />);
		expect(screen.getByText("My 12-Week Year")).toBeInTheDocument();
		expect(screen.getByText("Sign in with Discord")).toBeInTheDocument();
	});

	it("redirects to login when not authenticated", () => {
		window.history.pushState({}, "", "/dashboard");
		render(<App />);
		// Should redirect to login since session is null
		expect(screen.getByText("Sign in with Discord")).toBeInTheDocument();
	});
});
