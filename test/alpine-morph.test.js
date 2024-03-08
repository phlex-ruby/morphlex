import { fixture, html, expect } from "@open-wc/testing";
import { morph } from "../";
import { nextFrame } from "./helpers";

// adapted from: https://github.com/alpinejs/alpine/blob/891d68503960a39826e89f2f666d9b1e7ce3f0c9/tests/jest/morph/external.spec.js
describe("alpine-morph", () => {
	it("updates text content", async () => {
		const a = await fixture(html`<div>foo</div>`);
		const b = await fixture(html`<div>bar</div>`);

		morph(a, b);

		await nextFrame();

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("changes inner tag", async () => {
		const a = await fixture(html`<div><div>foo</div></div>`);
		const b = await fixture(html`<div><span>foo</span></div>`);

		morph(a, b);

		await nextFrame();

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("adds child", async () => {
		const a = await fixture(html`<div>foo</div>`);
		const b = await fixture(
			html`<div>
				foo
				<h1>baz</h1>
			</div>`,
		);

		morph(a, b);

		await nextFrame();

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("removes child", async () => {
		const a = await fixture(
			html`<div>
				foo
				<h1>baz</h1>
			</div>`,
		);
		const b = await fixture(html`<div>foo</div>`);

		morph(a, b);

		await nextFrame();

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("adds attribute", async () => {
		const a = await fixture(html`<div>foo</div>`);
		const b = await fixture(html`<div foo="bar">foo</div>`);

		morph(a, b);

		await nextFrame();

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("removes attribute", async () => {
		const a = await fixture(html`<div foo="bar">foo</div>`);
		const b = await fixture(html`<div>foo</div>`);

		morph(a, b);

		await nextFrame();

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("changes attribute", async () => {
		const a = await fixture(html`<div foo="bar">foo</div>`);
		const b = await fixture(html`<div foo="baz">foo</div>`);

		morph(a, b);

		await nextFrame();

		expect(a.outerHTML).to.equal(b.outerHTML);
	});
});
