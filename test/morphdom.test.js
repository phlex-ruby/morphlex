import { fixture, html, expect } from "@open-wc/testing";
import { morph } from "../";

// adapted from: https://github.com/patrick-steele-idem/morphdom/blob/e98d69e125cda814dd6d1ba71d6c7c9d93edc01e/test/browser/test.js
describe("morphdom", () => {
	it('should transform a simple el', async () => {
		const a = await fixture(html`<div class="foo"></div>`);
		const b = await fixture(html`<div class="bar"></div>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
		expect(a.className).to.equal("bar");
	});
});
