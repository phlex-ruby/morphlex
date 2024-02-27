export function morph(node, reference, options = {}) {
	const readonlyReference = reference;
	const idMap = new WeakMap();
	if (isParentNode(node) && isParentNode(readonlyReference)) {
		populateIdSets(node, idMap);
		populateIdSets(readonlyReference, idMap);
	}
	morphNode(node, readonlyReference, idMap, options);
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
function morphNode(node, ref, idMap, options) {
	const writableRef = ref;
	if (!(options.beforeNodeMorphed?.(node, writableRef) ?? true)) return;
	if (isElement(node) && isElement(ref) && node.tagName === ref.tagName) {
		if (node.hasAttributes() || ref.hasAttributes()) morphAttributes(node, ref, options);
		if (isHead(node) && isHead(ref)) {
			const refChildNodes = new Map();
			for (const child of ref.children) refChildNodes.set(child.outerHTML, child);
			for (const child of node.children) {
				const key = child.outerHTML;
				const refChild = refChildNodes.get(key);
				refChild ? refChildNodes.delete(key) : child.remove(); // TODO add callback
			}
			for (const refChild of refChildNodes.values()) appendChild(node, refChild.cloneNode(true), options);
		} else if (node.hasChildNodes() || ref.hasChildNodes()) morphChildNodes(node, ref, idMap, options);
	} else {
		if (isText(node) && isText(ref)) {
			updateProperty(node, "textContent", ref.textContent, options);
		} else if (isComment(node) && isComment(ref)) {
			updateProperty(node, "nodeValue", ref.nodeValue, options);
		} else replaceNode(node, ref.cloneNode(true), options);
	}
	options.afterNodeMorphed?.(node);
}
function morphAttributes(element, ref, options) {
	// Remove any excess attributes from the element that aren’t present in the reference.
	for (const { name } of element.attributes) ref.hasAttribute(name) || element.removeAttribute(name);
	// Copy attributes from the reference to the element, if they don’t already match.
	for (const { name, value } of ref.attributes) {
		const previousValue = element.getAttribute(name);
		if (previousValue !== value && (options.beforeAttributeUpdated?.(name, value, element) ?? true)) {
			element.setAttribute(name, value);
			options.afterAttributeUpdated?.(name, previousValue, element);
		}
	}
	// For certain types of elements, we need to do some extra work to ensure
	// the element’s state matches the reference elements’ state.
	if (isInput(element) && isInput(ref)) {
		updateProperty(element, "checked", ref.checked, options);
		updateProperty(element, "disabled", ref.disabled, options);
		updateProperty(element, "indeterminate", ref.indeterminate, options);
		if (
			element.type !== "file" &&
			!(options.ignoreActiveValue && document.activeElement === element) &&
			!(options.preserveModifiedValues && element.value !== element.defaultValue)
		)
			updateProperty(element, "value", ref.value, options);
	} else if (isOption(element) && isOption(ref)) updateProperty(element, "selected", ref.selected, options);
	else if (isTextArea(element) && isTextArea(ref)) {
		updateProperty(element, "value", ref.value, options);
		// TODO: Do we need this? If so, how do we integrate with the callback?
		const text = element.firstChild;
		if (text && isText(text)) updateProperty(text, "textContent", ref.value, options);
	}
}
// Iterates over the child nodes of the reference element, morphing the main element’s child nodes to match.
function morphChildNodes(element, ref, idMap, options) {
	const childNodes = [...element.childNodes];
	const refChildNodes = [...ref.childNodes];
	for (let i = 0; i < refChildNodes.length; i++) {
		const child = childNodes.at(i);
		const refChild = refChildNodes.at(i);
		if (child && refChild) morphChildNode(child, refChild, element, idMap, options);
		else if (refChild) {
			appendChild(element, refChild.cloneNode(true), options);
		} else if (child && (options.beforeNodeRemoved?.(child) ?? true)) {
			child.remove();
			options.afterNodeRemoved?.(child);
		}
	}
	// Remove any excess child nodes from the main element. This is separate because
	// the loop above might modify the length of the main element’s child nodes.
	while (element.childNodes.length > ref.childNodes.length) element.lastChild?.remove();
}
function updateProperty(element, propertyName, newValue, options) {
	const previousValue = element[propertyName];
	if (previousValue !== newValue && (options.beforePropertyUpdated?.(propertyName, newValue, element) ?? true)) {
		element[propertyName] = newValue;
		options.afterPropertyUpdated?.(propertyName, previousValue, element);
	}
}
function morphChildNode(child, ref, parent, idMap, options) {
	if (isElement(child) && isElement(ref)) morphChildElement(child, ref, parent, idMap, options);
	else morphNode(child, ref, idMap, options);
}
function morphChildElement(child, ref, parent, idMap, options) {
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
				return morphNode(currentNode, ref, idMap, options);
			} else {
				if (currentNode.id !== "") {
					const currentIdSet = idMap.get(currentNode);
					if (currentIdSet && refSetArray.some((it) => currentIdSet.has(it))) {
						parent.insertBefore(currentNode, child);
						return morphNode(currentNode, ref, idMap, options);
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
		morphNode(nextMatchByTagName, ref, idMap, options);
	} else replaceNode(child, ref.cloneNode(true), options);
}
function replaceNode(node, newNode, options) {
	if ((options.beforeNodeRemoved?.(node) ?? true) && (options.beforeNodeAdded?.(newNode, node.parentNode) ?? true)) {
		node.replaceWith(newNode);
		options.afterNodeAdded?.(newNode);
		options.afterNodeRemoved?.(node);
	}
}
function appendChild(node, newNode, options) {
	if (options.beforeNodeAdded?.(newNode, node) ?? true) {
		node.appendChild(newNode);
		options.afterNodeAdded?.(newNode);
	}
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
