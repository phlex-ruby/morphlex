import { fixture, html, expect } from "@open-wc/testing";
import { morph } from "../";

describe("my-test", () => {
	it.only("works", async () => {
		const a = await fixture(html`<h1></h1>`);
		const b = await fixture(html`<h1>Hello</h1>`);

		new MutationObserver(() => {
			throw new Error("The to node was mutated.");
		}).observe(b, { attributes: true, childList: true, subtree: true });

		morph(a, b);

		expect(a.textContent).to.equal(b.textContent);
	});

	it("removes elements", async () => {
		const a = await fixture(html`<h1><div></div></h1>`);
		const b = await fixture(html`<h1></h1>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
	});
});
