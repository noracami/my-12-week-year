import { describe, expect, it } from "vitest";
import app from "../index";

describe("Hono App", () => {
	it("returns Hello Hono! on GET /", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("Hello Hono!");
	});
});
