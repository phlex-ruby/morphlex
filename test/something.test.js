import { fixture, html, expect } from "@open-wc/testing";
import { morph } from "../";

describe("my-test", () => {
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

	// adapted from: https://github.com/alpinejs/alpine/blob/891d68503960a39826e89f2f666d9b1e7ce3f0c9/tests/jest/morph/external.spec.js
	it("updates text content", async () => {
		const a = await fixture(html`<div>foo</div>`);
		const b = await fixture(html`<div>bar</div>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("changes inner tag", async () => {
		const a = await fixture(html`<div><div>foo</div></div>`);
		const b = await fixture(html`<div><span>foo</span></div>`);

		morph(a, b);

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

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("adds attribute", async () => {
		const a = await fixture(html`<div>foo</div>`);
		const b = await fixture(html`<div foo="bar">foo</div>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("removes attribute", async () => {
		const a = await fixture(html`<div foo="bar">foo</div>`);
		const b = await fixture(html`<div>foo</div>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("changes attribute", async () => {
		const a = await fixture(html`<div foo="bar">foo</div>`);
		const b = await fixture(html`<div foo="baz">foo</div>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	// adapted from: https://github.com/choojs/nanomorph/blob/b8088d03b1113bddabff8aa0e44bd8db88d023c7/test/diff.js
	describe("root level", () => {
		it("should replace a node", async () => {
			const a = await fixture(html`<p>hello world</p>`);
			const b = await fixture(html`<div>hello world</div>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should replace a component", async () => {
			const a = await fixture(html`<div data-nanomorph-component-id="a">hello world</div>`);
			const b = await fixture(html`<div data-nanomorph-component-id="b">bye moon</div>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should morph a node", async () => {
			const a = await fixture(html`<p>hello world</p>`);
			const b = await fixture(html`<p>hello you</p>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should morph a node with namespaced attribute", async () => {
			const a = await fixture(html`<svg><use xlink:href="#heybooboo"></use></svg>`);
			const b = await fixture(html`<svg><use xlink:href="#boobear"></use></svg>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should ignore if node is same", async () => {
			const a = await fixture(html`<p>hello world</p>`);

			morph(a, a);

			expect(a.outerHTML).to.equal(a.outerHTML);
		});
	});

	describe("nested", () => {
		it("should replace a node", async () => {
			const a = await fixture(html`<main><p>hello world</p></main>`);
			const b = await fixture(html`<main><div>hello world</div></main>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should replace a node", async () => {
			const a = await fixture(html`<main><p>hello world</p></main>`);
			const b = await fixture(html`<main><p>hello you</p></main>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should replace a node", async () => {
			const a = await fixture(html`<main><p>hello world</p></main>`);

			morph(a, a);

			expect(a.outerHTML).to.equal(a.outerHTML);
		});

		it("should append a node", async () => {
			const a = await fixture(html`<main></main>`);
			const b = await fixture(html`<main><p>hello you</p></main>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should remove a node", async () => {
			const a = await fixture(html`<main><p>hello you</p></main>`);
			const b = await fixture(html`<main></main>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should update child nodes", async () => {
			const a = await fixture(html`<main><p>hello world</p></main>`);
			const b = await fixture(html`<section><p>hello you</p></section>`);

			morph(a, b, { childrenOnly: true });

			expect(a.outerHTML).to.equal("<main><p>hello you</p></main>");
		});
	});

	describe("values", () => {
		it("if new tree has no value and old tree does, remove value", async () => {
			const a = await fixture(html`<input type="text" value="howdy" />`);
			const b = await fixture(html`<input type="text" />`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
			expect(a.getAttribute("value")).to.equal(null);
			expect(a.value).to.equal("");
		});

		it("if new tree has null value and old tree does, remove value", async () => {
			const a = await fixture(html`<input type="text" value="howdy" />`);
			const b = await fixture(html`<input type="text" value=${null} />`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
			expect(a.getAttribute("value")).to.equal(null);
			expect(a.value).to.equal("");
		});

		it("if new tree has value in HTML and old tree does too, set value from new tree", async () => {
			const a = await fixture(html`<input type="text" value="howdy" />`);
			const b = await fixture(html`<input type="text" value="hi" />`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
			expect(a.value).to.equal("hi");
		});

		it("if new tree has value from mutation and old tree does too, set value from new tree", async () => {
			const a = await fixture(html`<input type="text" />`);
			a.value = "howdy";
			const b = await fixture(html`<input type="text" />`);
			b.value = "hi";

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
			expect(a.value).to.equal("hi");
		});

		it("if new tree has value in HTML and old tree does from mutation, set value from new tree", async () => {
			const a = await fixture(html`<input type="text" value="howdy" />`);
			const b = await fixture(html`<input type="text" />`);
			b.value = "hi";

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
			expect(a.value).to.equal("hi");
		});

		it("if new tree has value from mutation and old tree does in HTML, set value from new tree", async () => {
			const a = await fixture(html`<input type="text" value="howdy" />`);
			a.value = "howdy";
			const b = await fixture(html`<input type="text" value="hi" />`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
			expect(a.value).to.equal("hi");
		});
	});
});
