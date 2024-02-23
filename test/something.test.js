import { fixture, html, expect } from "@open-wc/testing";
import { morph } from "../";

describe("my-test", () => {
	it("supports nodes from iframes", async () => {
		const iframe = await fixture(html`<iframe></iframe>`);
		const a = await fixture(html`<h1>Hello World</h1>`);
		const b = iframe.contentDocument.createElement("h1");

		b.textContent = "Hello Joel";

		iframe.contentDocument.body.appendChild(b);

		morph(a, iframe.contentDocument?.body.children[0]);

		expect(a.textContent).to.equal("Hello Joel");
	});

	it("add text content", async () => {
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
