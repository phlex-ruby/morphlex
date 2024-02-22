type IdSet = Set<string>;
type IdMap = Map<Node, IdSet>;

export default function tinyMorph(from: Node, to: Node): void {
	const idMap: IdMap = new Map();

	if (from instanceof Element && to instanceof Element) {
		populateIdMapForNode(from, idMap);
		populateIdMapForNode(to, idMap);
	}

	morph(from, to, idMap);
}

function morph(from: Node, to: Node, idMap: IdMap, insertBefore?: Node, parent?: Node): void {
	idMap.delete(from);
	idMap.delete(to);

	if (parent && insertBefore && insertBefore !== from) parent.insertBefore(to, insertBefore);

	if (from instanceof Text && to instanceof Text) {
		from.textContent = to.textContent;
	} else if (from instanceof Element && to instanceof Element) {
		if (from.tagName === to.tagName) {
			if (to.attributes.length > 0) morphAttributes(from, to);
			if (to.childNodes.length > 0) morphChildNodes(from, to, idMap);
		} else {
			from.replaceWith(to.cloneNode(true));
		}
	}
}

function morphAttributes(from: Element, to: Element): void {
	for (const { name } of from.attributes) to.hasAttribute(name) || from.removeAttribute(name);
	for (const { name, value } of to.attributes) from.getAttribute(name) !== value && from.setAttribute(name, value);

	if (from instanceof HTMLInputElement && to instanceof HTMLInputElement) from.value = to.value;
	if (from instanceof HTMLOptionElement && to instanceof HTMLOptionElement) from.selected = to.selected;
	if (from instanceof HTMLTextAreaElement && to instanceof HTMLTextAreaElement) from.value = to.value;
}

function morphChildNodes(from: Element, to: Element, idMap: IdMap): void {
	for (let i = 0; i < to.childNodes.length; i++) {
		const childA = from.childNodes[i] as ChildNode | undefined;
		const childB = to.childNodes[i] as ChildNode | undefined;

		if (childA && childB) morphChildNode(childA, childB, idMap, from);
		else if (childB) from.appendChild(childB.cloneNode(true));
	}

	while (from.childNodes.length > to.childNodes.length) from.lastChild?.remove();
}

function morphChildNode(from: ChildNode, to: ChildNode, idMap: IdMap, parent: Element): void {
	if (from instanceof Element && to instanceof Element) {
		let current: ChildNode | null = from;
		let nextBestMatch: ChildNode | null = null;

		while (current && current instanceof Element) {
			if (current.id !== "" && current.id === to.id) {
				morph(current, to, idMap, from, parent);
				break;
			} else {
				const setA = idMap.get(current) as IdSet | undefined;
				const setB = idMap.get(to) as IdSet | undefined;

				if (setA && setB && numberOfItemsInCommon(setA, setB) > 0) {
					return morph(current, to, idMap, from, parent);
				} else if (!nextBestMatch && current.tagName === to.tagName) {
					nextBestMatch = current;
				}
			}

			current = current.nextSibling;
		}

		if (nextBestMatch) morph(nextBestMatch, to, idMap, from, parent);
		else from.replaceWith(to.cloneNode(true));
	} else morph(from, to, idMap);
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
