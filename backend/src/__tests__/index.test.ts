import { describe, expect, it } from "vitest";
import app from "../index";

describe("Hono App", () => {
	it("returns status ok on GET /", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({ status: "ok", message: "My 12-Week Year API" });
	});
});
