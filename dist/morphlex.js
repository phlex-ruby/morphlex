export function morph(node, reference) {
	const idMap = new Map();
	if (isParentNode(node) && isParentNode(reference)) {
		populateIdSets(node, idMap);
		populateIdSets(reference, idMap);
	}
	morphNodes(node, reference, idMap);
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
function morphNodes(node, ref, idMap) {
	if (isElement(node) && isElement(ref) && node.tagName === ref.tagName) {
		// We need to check if the element is an input, option, or textarea here, because they have
		// special attributes not covered by the isEqualNode check.
		if (!isInput(node) && !isOption(node) && !isTextArea(node) && node.isEqualNode(ref)) return;
		else {
			if (node.hasAttributes() || ref.hasAttributes()) morphAttributes(node, ref);
			if (node.hasChildNodes() || ref.hasChildNodes()) morphChildNodes(node, ref, idMap);
		}
	} else {
		if (node.isEqualNode(ref)) return;
		else if (isText(node) && isText(ref)) {
			if (node.textContent !== ref.textContent) node.textContent = ref.textContent;
		} else if (isComment(node) && isComment(ref)) {
			if (node.nodeValue !== ref.nodeValue) node.nodeValue = ref.nodeValue;
		} else node.replaceWith(ref.cloneNode(true));
	}
}
function morphAttributes(elm, ref) {
	// Remove any excess attributes from the element that aren’t present in the reference.
	for (const { name } of elm.attributes) ref.hasAttribute(name) || elm.removeAttribute(name);
	// Copy attributes from the reference to the element, if they don’t already match.
	for (const { name, value } of ref.attributes) elm.getAttribute(name) === value || elm.setAttribute(name, value);
	elm.nodeValue;
	// For certain types of elements, we need to do some extra work to ensure
	// the element’s state matches the reference elements’ state.
	if (isInput(elm) && isInput(ref)) {
		if (elm.checked !== ref.checked) elm.checked = ref.checked;
		if (elm.disabled !== ref.disabled) elm.disabled = ref.disabled;
		if (elm.indeterminate !== ref.indeterminate) elm.indeterminate = ref.indeterminate;
		if (elm.type !== "file" && elm.value !== ref.value) elm.value = ref.value;
	} else if (isOption(elm) && isOption(ref) && elm.selected !== ref.selected) elm.selected = ref.selected;
	else if (isTextArea(elm) && isTextArea(ref)) {
		if (elm.value !== ref.value) elm.value = ref.value;
		const text = elm.firstChild;
		if (text && isText(text) && text.textContent !== ref.value) text.textContent = ref.value;
	}
}
// Iterates over the child nodes of the reference element, morphing the main element’s child nodes to match.
function morphChildNodes(elem, ref, idMap) {
	const childNodes = [...elem.childNodes];
	const refChildNodes = [...ref.childNodes];
	for (let i = 0; i < refChildNodes.length; i++) {
		const child = childNodes.at(i);
		const refChild = refChildNodes.at(i);
		if (child && refChild) morphChildNode(child, refChild, elem, idMap);
		else if (refChild) elem.appendChild(refChild.cloneNode(true));
		else if (child) child.remove();
	}
	// Remove any excess child nodes from the main element. This is separate because
	// the loop above might modify the length of the main element’s child nodes.
	while (elem.childNodes.length > ref.childNodes.length) elem.lastChild?.remove();
}
function morphChildNode(child, ref, parent, idMap) {
	if (isElement(child) && isElement(ref)) morphChildElement(child, ref, parent, idMap);
	else morphNodes(child, ref, idMap);
}
function morphChildElement(child, ref, parent, idMap) {
	const refIdSet = idMap.get(ref);
	// Generate the array in advance of the loop
	const refSetArray = refIdSet ? [...refIdSet] : [];
	let currentNode = child;
	let nextMatchByTagName = null;
	// Try find a match by idSet, while also looking out for the next best match by tagName.
	while (currentNode) {
		if (isElement(currentNode)) {
			if (currentNode.id === ref.id) {
				parent.insertBefore(currentNode, child);
				return morphNodes(currentNode, ref, idMap);
			} else if (currentNode.id !== "") {
				const currentIdSet = idMap.get(currentNode);
				if (currentIdSet && refSetArray.some((it) => currentIdSet.has(it))) {
					parent.insertBefore(currentNode, child);
					return morphNodes(currentNode, ref, idMap);
				}
			} else if (!nextMatchByTagName && currentNode.tagName === ref.tagName) {
				nextMatchByTagName = currentNode;
			}
		}
		currentNode = currentNode.nextSibling;
	}
	if (nextMatchByTagName) {
		parent.insertBefore(nextMatchByTagName, child);
		morphNodes(nextMatchByTagName, ref, idMap);
	} else child.replaceWith(ref.cloneNode(true));
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
