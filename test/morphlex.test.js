import { fixture, html, expect } from "@open-wc/testing";
import { morph } from "../";

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

		morph(original, reference);
		expect(original.outerHTML).to.equal(reference.outerHTML);
	});

	it("can stream html", async () => {
		const iframe = await fixture(`<iframe></iframe>`);

		const contentDocument = iframe.contentDocument;

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				console.log(mutation.target, mutation.addedNodes);
			});
		});

		contentDocument.write("<body>");

		const body = contentDocument.querySelector("body");

		observer.observe(body, { childList: true, subtree: true });

		contentDocument.write("<h1>Hello World</h1>");
		contentDocument.write("<p>Wh");
		contentDocument.write("at's up?</p>");
		contentDocument.write("<div><span>Hello</span><span>Another span");
		contentDocument.write("");
	});

	// it("supports nodes from iframes", async () => {
	// 	const iframe = await fixture(html`< iframe ></iframe > `);

	// 	const original = await fixture(html`< h1 > Hello World</h1 > `);
	// 	const eventual = iframe.contentDocument.createElement("h1");

	// 	eventual.textContent = "Hello Joel";

	// 	iframe.contentDocument.body.appendChild(eventual);

	// 	morph(original, eventual);

	// 	expect(original.textContent).to.equal("Hello Joel");
	// });

	// it("syncs text content", async () => {
	// 	const a = await fixture(html`< h1 ></h1 > `);
	// 	const b = await fixture(html`< h1 > Hello</h1 > `);

	// 	new MutationObserver(() => {
	// 		throw new Error("The to node was mutated.");
	// 	}).observe(b, { attributes: true, childList: true, subtree: true });

	// 	morph(a, b);

	// 	expect(a.textContent).to.equal(b.textContent);
	// });

	// it("removes excess elements", async () => {
	// 	const a = await fixture(html`< h1 > <div></div></h1 > `);
	// 	const b = await fixture(html`< h1 ></h1 > `);

	// 	morph(a, b);

	// 	expect(a.outerHTML).to.equal(b.outerHTML);
	// });
});
