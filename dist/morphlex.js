export function morph(node, guide) {
	const idMap = new Map();
	if (isParentNode(node) && isParentNode(guide)) {
		populateIdSets(node, idMap);
		populateIdSets(guide, idMap);
	}
	morphNodes(node, guide, idMap);
}
// For each node with an ID, push that ID into the IdSet on the IdMap, for each of its parent elements.
function populateIdSets(node, idMap) {
	const elementsWithIds = node.querySelectorAll("[id]");
	for (const elementWithId of elementsWithIds) {
		const id = elementWithId.id;
		// Ignore empty IDs
		if (id === "") continue;
		let current = elementWithId;
		while (current) {
			const idSet = idMap.get(current);
			idSet ? idSet.add(id) : idMap.set(current, new Set([id]));
			if (current === elementWithId) break;
			current = current.parentElement;
		}
	}
}
// This is where we actually morph the nodes. The `morph` function exists to set up the `idMap`.
function morphNodes(node, guide, idMap) {
	if (isElement(node) && isElement(guide) && node.tagName === guide.tagName) {
		// We need to check if the element is an input, option, or textarea here, because they have
		// special attributes not covered by the isEqualNode check.
		if (!isInput(node) && !isOption(node) && !isTextArea(node) && node.isEqualNode(guide)) return;
		else {
			if (node.hasAttributes() || guide.hasAttributes()) morphAttributes(node, guide);
			if (node.hasChildNodes() || guide.hasChildNodes()) morphChildNodes(node, guide, idMap);
		}
	} else {
		if (node.isEqualNode(guide)) return;
		else if (isText(node) && isText(guide)) {
			if (node.textContent !== guide.textContent) node.textContent = guide.textContent;
		} else if (isComment(node) && isComment(guide)) {
			if (node.nodeValue !== guide.nodeValue) node.nodeValue = guide.nodeValue;
		} else node.replaceWith(guide.cloneNode(true));
	}
}
function morphAttributes(elem, guide) {
	// Remove any excess attributes from the element that aren’t present in the guide.
	for (const { name } of elem.attributes) guide.hasAttribute(name) || elem.removeAttribute(name);
	// Copy attributes from the guide to the element, if they don’t already match.
	for (const { name, value } of guide.attributes) elem.getAttribute(name) === value || elem.setAttribute(name, value);
	elem.nodeValue;
	// For certain types of elements, we need to do some extra work to ensure the element’s state matches the guide’s state.
	if (isInput(elem) && isInput(guide)) {
		if (elem.checked !== guide.checked) elem.checked = guide.checked;
		if (elem.disabled !== guide.disabled) elem.disabled = guide.disabled;
		if (elem.indeterminate !== guide.indeterminate) elem.indeterminate = guide.indeterminate;
		if (elem.type !== "file" && elem.value !== guide.value) elem.value = guide.value;
	} else if (isOption(elem) && isOption(guide) && elem.selected !== guide.selected) elem.selected = guide.selected;
	else if (isTextArea(elem) && isTextArea(guide)) {
		if (elem.value !== guide.value) elem.value = guide.value;
		const text = elem.firstChild;
		if (text && isText(text) && text.textContent !== guide.value) text.textContent = guide.value;
	}
}
// Iterates over the child nodes of the guide element, morphing the main element’s child nodes to match.
function morphChildNodes(elem, guide, idMap) {
	const childNodes = [...elem.childNodes];
	const guideChildNodes = [...guide.childNodes];
	for (let i = 0; i < guideChildNodes.length; i++) {
		const child = childNodes.at(i);
		const guideChild = guideChildNodes.at(i);
		if (child && guideChild) morphChildNode(child, guideChild, elem, idMap);
		else if (guideChild) elem.appendChild(guideChild.cloneNode(true));
		else if (child) child.remove();
	}
	// Remove any excess child nodes from the main element. This is separate because
	// the loop above might modify the length of the main element’s child nodes.
	while (elem.childNodes.length > guide.childNodes.length) elem.lastChild?.remove();
}
function morphChildNode(child, guide, parent, idMap) {
	if (isElement(child) && isElement(guide)) morphChildElement(child, guide, parent, idMap);
	else morphNodes(child, guide, idMap);
}
function morphChildElement(child, guide, parent, idMap) {
	const guideIdSet = idMap.get(guide);
	// Generate the array in advance of the loop
	const guideSetArray = guideIdSet ? [...guideIdSet] : [];
	let currentNode = child;
	let nextMatchByTagName = null;
	// Try find a match by idSet, while also looking out for the next best match by tagName.
	while (currentNode) {
		if (isElement(currentNode)) {
			if (currentNode.id === guide.id) {
				parent.insertBefore(currentNode, child);
				return morphNodes(currentNode, guide, idMap);
			} else if (currentNode.id !== "") {
				const currentIdSet = idMap.get(currentNode);
				if (currentIdSet && guideSetArray.some((it) => currentIdSet.has(it))) {
					parent.insertBefore(currentNode, child);
					return morphNodes(currentNode, guide, idMap);
				}
			} else if (!nextMatchByTagName && currentNode.tagName === guide.tagName) {
				nextMatchByTagName = currentNode;
			}
		}
		currentNode = currentNode.nextSibling;
	}
	if (nextMatchByTagName) {
		parent.insertBefore(nextMatchByTagName, child);
		morphNodes(nextMatchByTagName, guide, idMap);
	} else child.replaceWith(guide.cloneNode(true));
}
// We cannot use `instanceof` when nodes might be from different documents,
// so we use type guards instead. This keeps TypeScript happy, while doing
// the necessary checks at runtime.
function isText(node) {
	return node.nodeType === 3;
}
function isComment(node) {
	return node.nodeType === 8;
}
function isElement(node) {
	return node.nodeType === 1;
}
function isInput(element) {
	return element.localName === "input";
}
function isOption(element) {
	return element.localName === "option";
}
function isTextArea(element) {
	return element.localName === "textarea";
}
function isParentNode(node) {
	return node.nodeType === 1 || node.nodeType === 9 || node.nodeType === 11;
}
//# sourceMappingURL=morphlex.js.map
