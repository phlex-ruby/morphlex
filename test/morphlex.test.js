import { fixture, html, expect } from "@open-wc/testing";
import { morph } from "../";
import { nextFrame } from "./helpers";

describe("morph", () => {
	it("doesn't cause iframes to reload", async () => {
		const original = await fixture(
			`<div>
				<h1></h1>
				<iframe id="1" src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
			</div>`,
		);

		const reference = await fixture(
			`<div>
				<iframe id="1" src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
				<h1></h1>
			</div>`,
		);

		const originalIframe = original.querySelector("iframe");
		morph(original, reference);

		await nextFrame();

		expect(original.outerHTML).to.equal(reference.outerHTML);
	});

	it("supports nodes from iframes", async () => {
		const iframe = await fixture(html`<iframe></iframe>`);

		const original = await fixture(html`<h1>Hello World</h1>`);
		const eventual = iframe.contentDocument.createElement("h1");

		eventual.textContent = "Hello Joel";

		iframe.contentDocument.body.appendChild(eventual);

		morph(original, eventual);

		await nextFrame();

		expect(original.textContent).to.equal("Hello Joel");
	});

	it("syncs text content", async () => {
		const a = await fixture(html`<h1></h1>`);
		const b = await fixture(html`<h1>Hello</h1>`);

		new MutationObserver(() => {
			throw new Error("The to node was mutated.");
		}).observe(b, { attributes: true, childList: true, subtree: true });

		morph(a, b);

		await nextFrame();

		expect(a.textContent).to.equal(b.textContent);
	});

	it("removes excess elements", async () => {
		const a = await fixture(html`<h1><div></div></h1>`);
		const b = await fixture(html`<h1></h1>`);

		morph(a, b);

		await nextFrame();

		expect(a.outerHTML).to.equal(b.outerHTML);
	});
});
