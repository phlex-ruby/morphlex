export function morph(node, reference, options = {}) {
	const readonlyReference = reference;
	const idMap = new WeakMap();
	if (isParentNode(node) && isParentNode(readonlyReference)) {
		populateIdSets(node, idMap);
		populateIdSets(readonlyReference, idMap);
	}
	morphNode(node, readonlyReference, { ...options, idMap });
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
// This is where we actually morph the nodes. The `morph` function (above) exists only to set up the `idMap`.
function morphNode(node, ref, context) {
	if (!(context.beforeNodeMorphed?.({ node, referenceNode: ref }) ?? true)) return;
	if (isElement(node) && isElement(ref) && node.tagName === ref.tagName) {
		if (node.hasAttributes() || ref.hasAttributes()) morphAttributes(node, ref, context);
		if (isHead(node) && isHead(ref)) {
			const refChildNodes = new Map();
			for (const child of ref.children) refChildNodes.set(child.outerHTML, child);
			for (const child of node.children) {
				const key = child.outerHTML;
				const refChild = refChildNodes.get(key);
				refChild ? refChildNodes.delete(key) : removeNode(child, context);
			}
			for (const refChild of refChildNodes.values()) appendChild(node, refChild.cloneNode(true), context);
		} else if (node.hasChildNodes() || ref.hasChildNodes()) morphChildNodes(node, ref, context);
	} else {
		if (isText(node) && isText(ref)) {
			updateProperty(node, "textContent", ref.textContent, context);
		} else if (isComment(node) && isComment(ref)) {
			updateProperty(node, "nodeValue", ref.nodeValue, context);
		} else replaceNode(node, ref.cloneNode(true), context);
	}
	context.afterNodeMorphed?.({ node, referenceNode: ref });
}
function morphAttributes(element, ref, context) {
	// Remove any excess attributes from the element that aren’t present in the reference.
	for (const { name, value } of element.attributes) {
		if (!ref.hasAttribute(name) && (context.beforeAttributeUpdated?.({ element, attributeName: name, newValue: null }) ?? true)) {
			element.removeAttribute(name);
			context.afterAttributeUpdated?.({ element, attributeName: name, previousValue: value });
		}
	}
	// Copy attributes from the reference to the element, if they don’t already match.
	for (const { name, value } of ref.attributes) {
		const previousValue = element.getAttribute(name);
		if (
			previousValue !== value &&
			(context.beforeAttributeUpdated?.({ element, attributeName: name, newValue: value }) ?? true)
		) {
			element.setAttribute(name, value);
			context.afterAttributeUpdated?.({ element, attributeName: name, previousValue });
		}
	}
	// For certain types of elements, we need to do some extra work to ensure
	// the element’s state matches the reference elements’ state.
	if (isInput(element) && isInput(ref)) {
		updateProperty(element, "checked", ref.checked, context);
		updateProperty(element, "disabled", ref.disabled, context);
		updateProperty(element, "indeterminate", ref.indeterminate, context);
		if (
			element.type !== "file" &&
			!(context.ignoreActiveValue && document.activeElement === element) &&
			!(context.preserveModifiedValues && element.value !== element.defaultValue)
		)
			updateProperty(element, "value", ref.value, context);
	} else if (isOption(element) && isOption(ref)) updateProperty(element, "selected", ref.selected, context);
	else if (isTextArea(element) && isTextArea(ref)) {
		updateProperty(element, "value", ref.value, context);
		// TODO: Do we need this? If so, how do we integrate with the callback?
		const text = element.firstChild;
		if (text && isText(text)) updateProperty(text, "textContent", ref.value, context);
	}
}
// Iterates over the child nodes of the reference element, morphing the main element’s child nodes to match.
function morphChildNodes(element, ref, context) {
	const childNodes = [...element.childNodes];
	const refChildNodes = [...ref.childNodes];
	for (let i = 0; i < refChildNodes.length; i++) {
		const child = childNodes.at(i);
		const refChild = refChildNodes.at(i);
		if (child && refChild) morphChildNode(child, refChild, element, context);
		else if (refChild) {
			appendChild(element, refChild.cloneNode(true), context);
		} else if (child) removeNode(child, context);
	}
	// Remove any excess child nodes from the main element. This is separate because
	// the loop above might modify the length of the main element’s child nodes.
	while (element.childNodes.length > ref.childNodes.length) {
		const child = element.lastChild;
		if (child) removeNode(child, context);
	}
}
function updateProperty(node, propertyName, newValue, context) {
	const previousValue = node[propertyName];
	if (previousValue !== newValue && (context.beforePropertyUpdated?.({ node, propertyName, newValue }) ?? true)) {
		node[propertyName] = newValue;
		context.afterPropertyUpdated?.({ node, propertyName, previousValue });
	}
}
function morphChildNode(child, ref, parent, context) {
	if (isElement(child) && isElement(ref)) morphChildElement(child, ref, parent, context);
	else morphNode(child, ref, context);
}
function morphChildElement(child, ref, parent, context) {
	const refIdSet = context.idMap.get(ref);
	// Generate the array in advance of the loop
	const refSetArray = refIdSet ? [...refIdSet] : [];
	let currentNode = child;
	let nextMatchByTagName = null;
	// Try find a match by idSet, while also looking out for the next best match by tagName.
	while (currentNode) {
		if (isElement(currentNode)) {
			if (currentNode.id === ref.id) {
				parent.insertBefore(currentNode, child);
				return morphNode(currentNode, ref, context);
			} else {
				if (currentNode.id !== "") {
					const currentIdSet = context.idMap.get(currentNode);
					if (currentIdSet && refSetArray.some((it) => currentIdSet.has(it))) {
						parent.insertBefore(currentNode, child);
						return morphNode(currentNode, ref, context);
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
		morphNode(nextMatchByTagName, ref, context);
	} else replaceNode(child, ref.cloneNode(true), context);
}
function replaceNode(node, newNode, context) {
	if (
		(context.beforeNodeRemoved?.({ oldNode: node }) ?? true) &&
		(context.beforeNodeAdded?.({ newNode, parentNode: node.parentNode }) ?? true)
	) {
		node.replaceWith(newNode);
		context.afterNodeAdded?.({ newNode });
		context.afterNodeRemoved?.({ oldNode: node });
	}
}
function appendChild(node, newNode, context) {
	if (context.beforeNodeAdded?.({ newNode, parentNode: node }) ?? true) {
		node.appendChild(newNode);
		context.afterNodeAdded?.({ newNode });
	}
}
function removeNode(node, context) {
	if (context.beforeNodeRemoved?.({ oldNode: node }) ?? true) {
		node.remove();
		context.afterNodeRemoved?.({ oldNode: node });
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
