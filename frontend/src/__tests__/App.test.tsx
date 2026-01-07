import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("App", () => {
	it("renders headline", () => {
		render(<App />);
		expect(screen.getByText("Vite + React")).toBeInTheDocument();
	});

	it("increments counter on button click", () => {
		render(<App />);
		const button = screen.getByRole("button");
		expect(button).toHaveTextContent("count is 0");

		fireEvent.click(button);
		expect(button).toHaveTextContent("count is 1");
	});
});
