type IdSet = Set<string>;
type IdMap = Map<Node, IdSet>;

export function morph(from: Node, to: Node): void {
	const idMap: IdMap = new Map();

	if (isElement(from) && isElement(to)) {
		populateIdMapForNode(from, idMap);
		populateIdMapForNode(to, idMap);
	}

	morphNodes(from, to, idMap);
}

function morphNodes(from: Node, to: Node, idMap: IdMap, insertBefore?: Node, parent?: Node): void {
	if (parent && insertBefore && insertBefore !== from) parent.insertBefore(to, insertBefore);

	if (isText(from) && isText(to)) {
		if (from.textContent !== to.textContent) from.textContent = to.textContent;
	} else if (isElement(from) && isElement(to)) {
		if (from.tagName === to.tagName) {
			if (from.attributes.length > 0 || to.attributes.length > 0) morphAttributes(from, to);
			if (from.childNodes.length > 0 || to.childNodes.length > 0) morphChildNodes(from, to, idMap);
		} else from.replaceWith(to.cloneNode(true));
	} else {
		throw new Error(
			`Cannot morph nodes of different types: from is ${from.constructor.name}, to is ${to.constructor.name}`,
		);
	}
}

function morphAttributes(from: Element, to: Element): void {
	for (const { name } of from.attributes) to.hasAttribute(name) || from.removeAttribute(name);
	for (const { name, value } of to.attributes) from.getAttribute(name) !== value && from.setAttribute(name, value);

	if (isInput(from) && isInput(to)) from.value = to.value;
	if (isOption(from) && isOption(to)) from.selected = to.selected;
	if (isTextArea(from) && isTextArea(to)) from.value = to.value;
}

function morphChildNodes(from: Element, to: Element, idMap: IdMap): void {
	for (let i = 0; i < to.childNodes.length; i++) {
		const childA = [...from.childNodes].at(i);
		const childB = [...to.childNodes].at(i);

		if (childA && childB) morphChildNode(childA, childB, idMap, from);
		else if (childB) from.appendChild(childB.cloneNode(true));
	}

	while (from.childNodes.length > to.childNodes.length) from.lastChild?.remove();
}

function morphChildNode(from: ChildNode, to: ChildNode, idMap: IdMap, parent: Element): void {
	if (isElement(from) && isElement(to)) {
		let current: ChildNode | null = from;
		let nextBestMatch: ChildNode | null = null;

		while (current && isElement(current)) {
			if (current.id !== "" && current.id === to.id) {
				morphNodes(current, to, idMap, from, parent);
				break;
			} else {
				const setA = idMap.get(current);
				const setB = idMap.get(to);

				if (setA && setB && numberOfItemsInCommon(setA, setB) > 0) {
					return morphNodes(current, to, idMap, from, parent);
				} else if (!nextBestMatch && current.tagName === to.tagName) {
					nextBestMatch = current;
				}
			}

			current = current.nextSibling;
		}

		if (nextBestMatch) morphNodes(nextBestMatch, to, idMap, from, parent);
		else from.replaceWith(to.cloneNode(true));
	} else morphNodes(from, to, idMap);
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
