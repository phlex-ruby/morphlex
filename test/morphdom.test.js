import { fixture, html, expect } from "@open-wc/testing";
import { morph } from "../";

// adapted from: https://github.com/patrick-steele-idem/morphdom/blob/e98d69e125cda814dd6d1ba71d6c7c9d93edc01e/test/browser/test.js
describe("morphdom", () => {
	it("should transform a simple el", async () => {
		const a = await fixture(html`<div class="foo"></div>`);
		const b = await fixture(html`<div class="bar"></div>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
		expect(a.className).to.equal("bar");
	});

	// This test is broken — `a` is just a `<div>` and `b` is `null`
	it.skip("can wipe out body", async () => {
		const a = await fixture(
			html`<body>
				<div></div>
			</body>`,
		);
		const b = await fixture(html`<body></body>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
		expect(a.nodeName).to.equal("BODY");
		expect(a.children.length).to.equal(0);
	});

	it("does morph child with dup id", async () => {
		const a = await fixture(html`<div id="el-1" class="foo"><div id="el-1">A</div></div>`);
		const b = await fixture(html`<div id="el-1" class="bar"><div id="el-1">B</div></div>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
		expect(a.className).to.equal("bar");
		expect(a.id).to.equal("el-1");
		expect(a.firstElementChild.id).to.equal("el-1");
		expect(a.firstElementChild.textContent).to.equal("B");
	});

	it("does keep inner dup id", async () => {
		const node = await fixture(html`<div id="el-1" class="foo"><div id="el-1">A</div></div>`);
		const ref = await fixture(html`<div id="el-1" class="zoo"><div id="el-inner">B</div></div>`);

		morph(node, ref);

		expect(node.outerHTML).to.equal(ref.outerHTML);
		expect(node.className).to.equal("zoo");
		expect(node.id).to.equal("el-1");
		expect(node.firstChild.id).to.equal("el-inner");
		expect(node.firstChild.textContent).to.equal("B");
	});

	it.skip("nested duplicate ids are morphed correctly", async () => {
		const a = await fixture(
			html`<div>
				<p id="hi" class="foo">A</p>
				<p id="hi" class="bar">B</p>
			</div>`,
		);
		const b = await fixture(html`<div><p id="hi" class="foo">A</p></div>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
		expect(a.children.length).to.equal(2);
		expect(a.children[0].id).to.equal("hi");
		expect(a.children[0].className).to.equal("foo");
		expect(a.children[0].textContent).to.equal("A");
		// TODO: these should not be here
		expect(a.children[1].id).to.equal("hi");
		expect(a.children[1].className).to.equal("bar");
		expect(a.children[1].textContent).to.equal("B");
	});

	it("incompatible matching ids are morphed correctly", async () => {
		const a = await fixture(
			html`<div>
				<h1 id="foo" class="foo">A</h1>
				<h2 id="matching" class="bar">B</h2>
			</div>`,
		);
		const b = await fixture(html`<div><h1 id="matching" class="baz">C</h1></div>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
		expect(a.children.length).to.equal(1);
		expect(a.children[0].id).to.equal("matching");
		expect(a.children[0].className).to.equal("baz");
		expect(a.children[0].textContent).to.equal("C");
	});

	it("should transform a text input el", async () => {
		const a = await fixture(html`<input type="text" value="Hello World" />`);
		const b = await fixture(html`<input type="text" value="Hello World 2" />`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
		expect(a.value).to.equal("Hello World 2");
	});

	it("should transform a checkbox input type attribute", async () => {
		const a = await fixture(html`<input type="checkbox" checked="" />`);
		a.checked = false;
		const b = await fixture(html`<input type="text" checked="" />`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
		expect(a.checked).to.equal(true);
		expect(a.type).to.equal("text");
	});

	it("should transform a checkbox input property", async () => {
		const a = await fixture(html`<input type="checkbox" />`);
		a.checked = false;
		const b = await fixture(html`<input type="checkbox" />`);
		b.checked = true;

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
		expect(a.checked).to.equal(true);
		expect(a.type).to.equal("checkbox");
	});
});
