import { fixture, html, expect } from "@open-wc/testing";
import { morph } from "../";

// adapted from: https://github.com/choojs/nanomorph/blob/b8088d03b1113bddabff8aa0e44bd8db88d023c7/test/diff.js
describe("nanomorph", () => {
	describe("root level", () => {
		it.skip("should replace a node", async () => {
			// Note: I have a feeling this actually works, but the test is wrong,
			// since the test asserts on the original node, which is replaced.
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

		it.skip("should update child nodes", async () => {
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

		it.skip("if new tree has null value and old tree does, remove value", async () => {
			const a = await fixture(html`<input type="text" value="howdy" />`);
			const b = await fixture(html`<input type="text" value=${null} />`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
			expect(a.getAttribute("value")).to.equal(null);
			expect(a.value).to.equal("");
		});

		it.skip("if new tree has value in HTML and old tree does too, set value from new tree", async () => {
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

	describe("boolean properties", () => {
		describe("checked", () => {
			it("if new tree has no checked and old tree does, remove value", async () => {
				const a = await fixture(html`<input type="checkbox" checked=${true} />`);
				const b = await fixture(html`<input type="checkbox" />`);

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.checked).to.equal(false);
			});

			it("if new tree has checked and old tree does not, add value", async () => {
				const a = await fixture(html`<input type="checkbox" />`);
				const b = await fixture(html`<input type="checkbox" checked=${true} />`);

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.checked).to.equal(true);
			});

			it("if new tree has checked=false and old tree has checked=true, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" checked=${false} />`);
				const b = await fixture(html`<input type="checkbox" checked=${true} />`);

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.checked).to.equal(true);
			});

			it.skip("if new tree has checked=true and old tree has checked=false, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" checked=${true} />`);
				const b = await fixture(html`<input type="checkbox" checked=${false} />`);

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.checked).to.equal(false);
			});

			it.skip("if new tree has no checked and old tree has checked mutated to true, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" />`);
				const b = await fixture(html`<input type="checkbox" />`);
				b.checked = true;

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.checked).to.equal(true);
			});

			it.skip("if new tree has checked=false and old tree has checked mutated to true, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" checked=${false} />`);
				const b = await fixture(html`<input type="checkbox" />`);
				b.checked = true;

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.checked).to.equal(true);
			});

			it("if new tree has checked=true and old tree has checked mutated to false, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" checked=${true} />`);
				const b = await fixture(html`<input type="checkbox" />`);
				b.checked = false;

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.checked).to.equal(false);
			});

			it("if new tree has no checked and old tree has checked=true, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" />`);
				const b = await fixture(html`<input type="checkbox" checked=${true} />`);

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.checked).to.equal(true);
			});
		});

		describe("disabled", () => {
			it("if new tree has no disabled and old tree does, remove value", async () => {
				const a = await fixture(html`<input type="checkbox" disabled=${true} />`);
				const b = await fixture(html`<input type="checkbox" />`);

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.disabled).to.equal(false);
			});

			it("if new tree has disabled and old tree does not, add value", async () => {
				const a = await fixture(html`<input type="checkbox" />`);
				const b = await fixture(html`<input type="checkbox" disabled=${true} />`);

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.disabled).to.equal(true);
			});

			it("if new tree has disabled=false and old tree has disabled=true, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" disabled=${false} />`);
				const b = await fixture(html`<input type="checkbox" disabled=${true} />`);

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.disabled).to.equal(true);
			});

			it.skip("if new tree has disabled=true and old tree has disabled=false, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" disabled=${true} />`);
				const b = await fixture(html`<input type="checkbox" disabled=${false} />`);

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.disabled).to.equal(false);
			});

			it("if new tree has no disabled and old tree has disabled mutated to true, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" />`);
				const b = await fixture(html`<input type="checkbox" />`);
				b.disabled = true;

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.disabled).to.equal(true);
			});

			it("if new tree has disabled=false and old tree has disabled mutated to true, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" disabled=${false} />`);
				const b = await fixture(html`<input type="checkbox" />`);
				b.disabled = true;

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.disabled).to.equal(true);
			});

			it("if new tree has disabled=true and old tree has disabled mutated to false, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" disabled=${true} />`);
				const b = await fixture(html`<input type="checkbox" />`);
				b.disabled = false;

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.disabled).to.equal(false);
			});

			it("if new tree has no disabled and old tree has disabled=true, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" />`);
				const b = await fixture(html`<input type="checkbox" disabled=${true} />`);

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.disabled).to.equal(true);
			});
		});

		describe("indeterminate", () => {
			it.skip("if new tree has no indeterminate and old tree has indeterminate mutated to true, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" />`);
				const b = await fixture(html`<input type="checkbox" />`);
				b.indeterminate = true;

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.indeterminate).to.equal(true);
			});

			it("if new tree has no indeterminate and old tree has indeterminate mutated to false, set value from new tree", async () => {
				const a = await fixture(html`<input type="checkbox" />`);
				const b = await fixture(html`<input type="checkbox" />`);
				b.indeterminate = false;

				morph(a, b);

				expect(a.outerHTML).to.equal(b.outerHTML);
				expect(a.indeterminate).to.equal(false);
			});
		});
	});

	describe("lists", () => {
		it("should append nodes", async () => {
			const a = await fixture(html`<ul></ul>`);
			const b = await fixture(
				html`<ul>
					<li>1</li>
					<li>2</li>
					<li>3</li>
					<li>4</li>
					<li>5</li>
				</ul>`,
			);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should remove nodes", async () => {
			const a = await fixture(
				html`<ul>
					<li>1</li>
					<li>2</li>
					<li>3</li>
					<li>4</li>
					<li>5</li>
				</ul>`,
			);
			const b = await fixture(html`<ul></ul>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});
	});

	describe("selectables", () => {
		it("should append nodes", async () => {
			const a = await fixture(html`<select></select>`);
			const b = await fixture(
				html`<select>
					<option>1</option>
					<option>2</option>
					<option>3</option>
					<option>4</option>
				</select>`,
			);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should append nodes (including optgroups)", async () => {
			const a = await fixture(html`<select></select>`);
			const b = await fixture(
				html`<select>
					<optgroup>
						<option>1</option>
						<option>2</option>
					</optgroup>
					<option>3</option>
					<option>4</option>
				</select>`,
			);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should remove nodes", async () => {
			const a = await fixture(
				html`<select>
					<option>1</option>
					<option>2</option>
					<option>3</option>
					<option>4</option>
				</select>`,
			);
			const b = await fixture(html`<select></select>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should remove nodes (including optgroups)", async () => {
			const a = await fixture(
				html`<select>
					<optgroup>
						<option>1</option>
						<option>2</option>
					</optgroup>
					<option>3</option>
					<option>4</option>
				</select>`,
			);
			const b = await fixture(html`<select></select>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should add selected", async () => {
			const a = await fixture(
				html`<select>
					<option>1</option>
					<option>2</option>
				</select>`,
			);
			const b = await fixture(
				html`<select>
					<option>1</option>
					<option selected>2</option>
				</select>`,
			);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should add selected (xhtml)", async () => {
			const a = await fixture(
				html`<select>
					<option>1</option>
					<option>2</option>
				</select>`,
			);
			const b = await fixture(
				html`<select>
					<option>1</option>
					<option selected="selected">2</option>
				</select>`,
			);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("should switch selected", async () => {
			const a = await fixture(
				html`<select>
					<option selected="selected">1</option>
					<option>2</option>
				</select>`,
			);
			const b = await fixture(
				html`<select>
					<option>1</option>
					<option selected="selected">2</option>
				</select>`,
			);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});
	});

	it("should replace nodes", async () => {
		const a = await fixture(
			html`<ul>
				<li>1</li>
				<li>2</li>
				<li>3</li>
				<li>4</li>
				<li>5</li>
			</ul>`,
		);
		const b = await fixture(
			html`<ul>
				<div>1</div>
				<li>2</li>
				<p>3</p>
				<li>4</li>
				<li>5</li>
			</ul>`,
		);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("should replace nodes after multiple iterations", async () => {
		const a = await fixture(html`<ul></ul>`);
		const b = await fixture(
			html`<ul>
				<li>1</li>
				<li>2</li>
				<li>3</li>
				<li>4</li>
				<li>5</li>
			</ul>`,
		);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);

		const c = await fixture(
			html`<ul>
				<div>1</div>
				<li>2</li>
				<p>3</p>
				<li>4</li>
				<li>5</li>
			</ul>`,
		);

		morph(a, c);

		expect(a.outerHTML).to.equal(c.outerHTML);
	});

	describe("use id as a key hint", () => {
		it.skip("appends an element", async () => {
			const a = await fixture(
				html`<ul>
					<li id="a"></li>
					<li id="b"></li>
					<li id="c"></li>
				</ul>`,
			);
			const b = await fixture(
				html`<ul>
					<li id="a"></li>
					<li id="new"></li>
					<li id="b"></li>
					<li id="c"></li>
				</ul>`,
			);

			const oldFirst = a.children[0];
			const oldSecond = a.children[1];
			const oldThird = a.children[2];

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
			expect(a.children[0]).to.equal(oldFirst);
			expect(a.children[1]).to.equal(oldSecond);
			expect(a.children[2]).to.equal(oldThird);
		});

		it.skip("handles non-id elements", async () => {
			const a = await fixture(
				html`<ul>
					<li></li>
					<li id="a"></li>
					<li id="b"></li>
					<li id="c"></li>
					<li></li>
				</ul>`,
			);
			const b = await fixture(
				html`<ul>
					<li></li>
					<li id="a"></li>
					<li id="new"></li>
					<li id="b"></li>
					<li id="c"></li>
					<li></li>
				</ul>`,
			);

			const oldSecond = a.children[1];
			const oldThird = a.children[2];
			const oldFourth = a.children[3];

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
			expect(a.children[1]).to.equal(oldSecond);
			expect(a.children[3]).to.equal(oldThird);
			expect(a.children[4]).to.equal(oldFourth);
		});

		it("copies over children", async () => {
			const a = await fixture(
				html`<section>
					'hello'
					<section></section>
				</section>`,
			);
			const b = await fixture(
				html`<section>
					<div></div>
					<section></section>
				</section>`,
			);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it.skip("removes an element", async () => {
			const a = await fixture(
				html`<ul>
					<li id="a"></li>
					<li id="b"></li>
					<li id="c"></li>
				</ul>`,
			);
			const b = await fixture(
				html`<ul>
					<li id="a"></li>
					<li id="c"></li>
				</ul>`,
			);

			const oldFirst = a.children[0];
			const oldThird = a.children[2];

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
			expect(a.children[0]).to.equal(oldFirst);
			expect(a.children[1]).to.equal(oldThird);
		});

		it("id match still morphs", async () => {
			const a = await fixture(html`<li id="12">FOO</li>`);
			const b = await fixture(html`<li id="12">BAR</li>`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("removes orphaned keyed nodes", async () => {
			const a = await fixture(html`
				<div>
					<div>1</div>
					<li id="a">a</li>
				</div>
			`);
			const b = await fixture(html`
				<div>
					<div>2</div>
					<li id="b">b</li>
				</div>
			`);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});

		it("whitespace", async () => {
			const a = await fixture(html`<ul></ul>`);
			const b = await fixture(
				html`<ul>
					<li></li>
					<li></li>
				</ul>`,
			);

			morph(a, b);

			expect(a.outerHTML).to.equal(b.outerHTML);
		});
	});

	it.skip("allows morphing from Node to NodeList", async () => {
		const a = await fixture(html`<div><div>a</div></div>`);
		const b = await fixture(
			html`<div>a</div>
				<div>b</div>`,
		);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it.skip("allows morphing from NodeList to Node", async () => {
		const a = await fixture(
			html`<div>a</div>
				<div>b</div>`,
		);
		const b = await fixture(html`<div><div>a</div></div>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("allows morphing from NodeList to NodeList", async () => {
		const a = await fixture(
			html`<div>a</div>
				<div>b</div>`,
		);
		const b = await fixture(
			html`<div>z</div>
				<div>y</div>`,
		);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
	});

	it("allows morphing from Node to Node", async () => {
		const a = await fixture(html`<div><div>a</div></div>`);
		const b = await fixture(html`<div><div>b</div></div>`);

		morph(a, b);

		expect(a.outerHTML).to.equal(b.outerHTML);
	});
});
