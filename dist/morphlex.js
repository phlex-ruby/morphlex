export function morph(node, reference, opts) {
	const readonlyReference = reference;
	const idMap = new WeakMap();
	if (isParentNode(node) && isParentNode(readonlyReference)) {
		populateIdSets(node, idMap);
		populateIdSets(readonlyReference, idMap);
	}
	morphNodes(node, readonlyReference, idMap, opts);
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
function morphNodes(node, ref, idMap, opts) {
	if (isElement(node) && isElement(ref) && node.tagName === ref.tagName) {
		if (node.hasAttributes() || ref.hasAttributes()) morphAttributes(node, ref, opts);
		if (isHead(node) && isHead(ref)) {
			const refChildNodes = new Map();
			for (const child of ref.children) refChildNodes.set(child.outerHTML, child);
			for (const child of node.children) {
				const key = child.outerHTML;
				const refChild = refChildNodes.get(key);
				refChild ? refChildNodes.delete(key) : child.remove();
			}
			for (const refChild of refChildNodes.values()) node.appendChild(refChild.cloneNode(true));
		} else if (node.hasChildNodes() || ref.hasChildNodes()) morphChildNodes(node, ref, idMap, opts);
	} else {
		if (isText(node) && isText(ref)) {
			if (node.textContent !== ref.textContent) node.textContent = ref.textContent;
		} else if (isComment(node) && isComment(ref)) {
			if (node.nodeValue !== ref.nodeValue) node.nodeValue = ref.nodeValue;
		} else node.replaceWith(ref.cloneNode(true));
	}
}
function morphAttributes(elm, ref, opts) {
	// Remove any excess attributes from the element that aren’t present in the reference.
	for (const { name } of elm.attributes) ref.hasAttribute(name) || elm.removeAttribute(name);
	// Copy attributes from the reference to the element, if they don’t already match.
	for (const { name, value } of ref.attributes) elm.getAttribute(name) === value || elm.setAttribute(name, value);
	// For certain types of elements, we need to do some extra work to ensure
	// the element’s state matches the reference elements’ state.
	if (isInput(elm) && isInput(ref)) {
		if (elm.checked !== ref.checked) elm.checked = ref.checked;
		if (elm.disabled !== ref.disabled) elm.disabled = ref.disabled;
		if (elm.indeterminate !== ref.indeterminate) elm.indeterminate = ref.indeterminate;
		if (
			elm.type !== "file" &&
			elm.value !== ref.value &&
			!(opts.ignoreActiveValue && document.activeElement === elm) &&
			!(opts.preserveModifiedValues && elm.value !== elm.defaultValue)
		)
			elm.value = ref.value;
	} else if (isOption(elm) && isOption(ref) && elm.selected !== ref.selected) elm.selected = ref.selected;
	else if (isTextArea(elm) && isTextArea(ref)) {
		if (elm.value !== ref.value) elm.value = ref.value;
		const text = elm.firstChild;
		if (text && isText(text) && text.textContent !== ref.value) text.textContent = ref.value;
	}
}
// Iterates over the child nodes of the reference element, morphing the main element’s child nodes to match.
function morphChildNodes(element, ref, idMap, opts) {
	const childNodes = [...element.childNodes];
	const refChildNodes = [...ref.childNodes];
	for (let i = 0; i < refChildNodes.length; i++) {
		const child = childNodes.at(i);
		const refChild = refChildNodes.at(i);
		if (child && refChild) morphChildNode(child, refChild, element, idMap, opts);
		else if (refChild) {
			const event = new CustomEvent("beforeNodeInserted", {
				bubbles: true,
				cancelable: true,
				detail: {
					node: refChild,
				},
			});
			if (!event.defaultPrevented) element.appendChild(refChild.cloneNode(true));
		} else if (child) child.remove();
	}
	// Remove any excess child nodes from the main element. This is separate because
	// the loop above might modify the length of the main element’s child nodes.
	while (element.childNodes.length > ref.childNodes.length) element.lastChild?.remove();
}
function morphChildNode(child, ref, parent, idMap, opts) {
	if (isElement(child) && isElement(ref)) morphChildElement(child, ref, parent, idMap, opts);
	else morphNodes(child, ref, idMap, opts);
}
function morphChildElement(child, ref, parent, idMap, opts) {
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
				return morphNodes(currentNode, ref, idMap, opts);
			} else {
				if (currentNode.id !== "") {
					const currentIdSet = idMap.get(currentNode);
					if (currentIdSet && refSetArray.some((it) => currentIdSet.has(it))) {
						parent.insertBefore(currentNode, child);
						return morphNodes(currentNode, ref, idMap, opts);
					} else if (!nextMatchByTagName && currentNode.tagName === ref.tagName) {
						nextMatchByTagName = currentNode;
					}
				}
			}
		}
		currentNode = currentNode.nextSibling;
	}
	if (nextMatchByTagName) {
		if (nextMatchByTagName !== child) parent.insertBefore(nextMatchByTagName, child);
		morphNodes(nextMatchByTagName, ref, idMap, opts);
	} else child.replaceWith(ref.cloneNode(true));
}
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
function isHead(element) {
	return element.localName === "head";
}
function isParentNode(node) {
	return node.nodeType === 1 || node.nodeType === 9 || node.nodeType === 11;
}
//# sourceMappingURL=morphlex.js.map
