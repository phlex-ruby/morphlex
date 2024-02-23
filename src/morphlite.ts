type IdSet = Set<string>;
type IdMap = Map<Node, IdSet>;

export function morph(node: Node, guide: Node): void {
	const idMap: IdMap = new Map();

	if (isElement(node) && isElement(guide)) {
		populateIdMapForNode(node, idMap);
		populateIdMapForNode(guide, idMap);
	}

	morphNodes(node, guide, idMap);
}

function morphNodes(node: Node, guide: Node, idMap: IdMap, insertBefore?: Node, parent?: Node): void {
	if (parent && insertBefore && insertBefore !== node) parent.insertBefore(guide, insertBefore);

	if (isText(node) && isText(guide)) {
		if (node.textContent !== guide.textContent) node.textContent = guide.textContent;
	} else if (isElement(node) && isElement(guide)) {
		if (node.tagName === guide.tagName) {
			if (node.attributes.length > 0 || guide.attributes.length > 0) morphAttributes(node, guide);
			if (node.childNodes.length > 0 || guide.childNodes.length > 0) morphChildNodes(node, guide, idMap);
		} else node.replaceWith(guide.cloneNode(true));
	} else throw new Error(`Cannot morph from ${node.constructor.name}, to ${guide.constructor.name}`);
}

function morphAttributes(elem: Element, guide: Element): void {
	for (const { name } of elem.attributes) guide.hasAttribute(name) || elem.removeAttribute(name);
	for (const { name, value } of guide.attributes) elem.getAttribute(name) !== value && elem.setAttribute(name, value);

	if (isInput(elem) && isInput(guide) && elem.value !== guide.value) elem.value = guide.value;
	if (isOption(elem) && isOption(guide)) elem.selected = guide.selected;
	if (isTextArea(elem) && isTextArea(guide)) elem.value = guide.value;
}

function morphChildNodes(elem: Element, guide: Element, idMap: IdMap): void {
	for (let i = 0; i < guide.childNodes.length; i++) {
		const childA = [...elem.childNodes].at(i);
		const childB = [...guide.childNodes].at(i);

		if (childA && childB) morphChildNode(childA, childB, idMap, elem);
		else if (childB) elem.appendChild(childB.cloneNode(true));
	}

	while (elem.childNodes.length > guide.childNodes.length) elem.lastChild?.remove();
}

function morphChildNode(child: ChildNode, guide: ChildNode, idMap: IdMap, parent: Element): void {
	if (isElement(child) && isElement(guide)) {
		let current: ChildNode | null = child;
		let nextBestMatch: ChildNode | null = null;

		while (current && isElement(current)) {
			if (current.id !== "" && current.id === guide.id) {
				morphNodes(current, guide, idMap, child, parent);
				break;
			} else {
				const setA = idMap.get(current);
				const setB = idMap.get(guide);

				if (setA && setB && numberOfItemsInCommon(setA, setB) > 0) {
					return morphNodes(current, guide, idMap, child, parent);
				} else if (!nextBestMatch && current.tagName === guide.tagName) {
					nextBestMatch = current;
				}
			}

			current = current.nextSibling;
		}

		if (nextBestMatch) morphNodes(nextBestMatch, guide, idMap, child, parent);
		else child.replaceWith(guide.cloneNode(true));
	} else morphNodes(child, guide, idMap);
}

function populateIdMapForNode(node: ParentNode, idMap: IdMap): void {
	const parent: HTMLElement | null = node.parentElement;
	const elements: NodeListOf<Element> = node.querySelectorAll("[id]");

	for (const element of elements) {
		if (element.id === "") continue;
		let current: Element | null = element;

		while (current && current !== parent) {
			const idSet: IdSet | undefined = idMap.get(current);
			idSet ? idSet.add(element.id) : idMap.set(current, new Set([element.id]));
			current = current.parentElement;
		}
	}
}

function numberOfItemsInCommon<T>(a: Set<T>, b: Set<T>): number {
	return [...a].filter((item) => b.has(item)).length;
}

// We cannot use `instanceof` when nodes might be from different documents,
// so we use type guards instead. This keeps TypeScript happy, while doing
// the necessary checks at runtime.

function isElement(node: Node): node is Element {
	return node.nodeType === 1;
}

function isText(node: Node): node is Text {
	return node.nodeType === 3;
}

function isInput(element: Element): element is HTMLInputElement {
	return element.localName === "input";
}

function isOption(element: Element): element is HTMLOptionElement {
	return element.localName === "option";
}

function isTextArea(element: Element): element is HTMLTextAreaElement {
	return element.localName === "textarea";
}
