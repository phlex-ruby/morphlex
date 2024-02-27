type IdSet = Set<string>;
type IdMap = WeakMap<ReadonlyNode<Node>, IdSet>;
type ObjectKey = string | number | symbol;

// Maps to a type that can only read properties
type StrongReadonly<T> = { readonly [K in keyof T as T[K] extends Function ? never : K]: T[K] };

// Maps a Node to a type limited to read-only properties and methods for that Node
type ReadonlyNode<T extends Node> =
	| T
	| (StrongReadonly<T> & {
			readonly cloneNode: (deep: true) => Node;
			readonly childNodes: ReadonlyNodeList<ChildNode>;
			readonly querySelectorAll: (query: string) => ReadonlyNodeList<Element>;
			readonly parentElement: ReadonlyNode<Element> | null;
			readonly hasAttribute: (name: string) => boolean;
			readonly hasAttributes: () => boolean;
			readonly hasChildNodes: () => boolean;
			readonly children: ReadonlyNodeList<Element>;
	  });

// Maps a node to a read-only node list of nodes of that type
type ReadonlyNodeList<T extends Node> =
	| NodeListOf<T>
	| {
			[Symbol.iterator](): IterableIterator<ReadonlyNode<T>>;
			readonly [index: number]: ReadonlyNode<T>;
			readonly length: NodeListOf<T>["length"];
	  };

export interface Options {
	ignoreActiveValue?: boolean;
	preserveModifiedValues?: boolean;

	beforeNodeMorphed?: ({ node, referenceNode }: { node: Node; referenceNode: Node }) => boolean;
	afterNodeMorphed?: ({ node, referenceNode }: { node: Node; referenceNode: Node }) => void;

	beforeNodeAdded?: ({ newNode, parentNode }: { newNode: Node; parentNode: ParentNode | null }) => boolean;
	afterNodeAdded?: ({ newNode }: { newNode: Node }) => void;

	beforeNodeRemoved?: ({ oldNode }: { oldNode: Node }) => boolean;
	afterNodeRemoved?: ({ oldNode }: { oldNode: Node }) => void;

	beforeAttributeUpdated?: ({
		element,
		attributeName,
		newValue,
	}: {
		element: Element;
		attributeName: string;
		newValue: string | null;
	}) => boolean;

	afterAttributeUpdated?: ({
		element,
		attributeName,
		previousValue,
	}: {
		element: Element;
		attributeName: string;
		previousValue: string | null;
	}) => void;

	beforePropertyUpdated?: ({
		node,
		propertyName,
		newValue,
	}: {
		node: Node;
		propertyName: ObjectKey;
		newValue: unknown;
	}) => boolean;

	afterPropertyUpdated?: ({
		node,
		propertyName,
		previousValue,
	}: {
		node: Node;
		propertyName: ObjectKey;
		previousValue: unknown;
	}) => void;
}

type Context = Options & { idMap: IdMap };

export function morph(node: ChildNode, reference: ChildNode, options: Options = {}): void {
	const readonlyReference = reference as ReadonlyNode<ChildNode>;
	const idMap: IdMap = new WeakMap();

	if (isParentNode(node) && isParentNode(readonlyReference)) {
		populateIdSets(node, idMap);
		populateIdSets(readonlyReference, idMap);
	}

	morphNode(node, readonlyReference, { ...options, idMap });
}

// For each node with an ID, push that ID into the IdSet on the IdMap, for each of its parent elements.
function populateIdSets(node: ReadonlyNode<ParentNode>, idMap: IdMap): void {
	const elementsWithIds = node.querySelectorAll("[id]");

	for (const elementWithId of elementsWithIds) {
		const id = elementWithId.id;

		// Ignore empty IDs
		if (id === "") continue;

		let current: ReadonlyNode<Element> | null = elementWithId;

		while (current) {
			const idSet: IdSet | undefined = idMap.get(current);
			idSet ? idSet.add(id) : idMap.set(current, new Set([id]));
			if (current === elementWithId) break;
			current = current.parentElement;
		}
	}
}

// This is where we actually morph the nodes. The `morph` function (above) exists only to set up the `idMap`.
function morphNode(node: ChildNode, ref: ReadonlyNode<ChildNode>, context: Context): void {
	if (!(context.beforeNodeMorphed?.({ node, referenceNode: ref as ChildNode }) ?? true)) return;

	if (isElement(node) && isElement(ref) && node.tagName === ref.tagName) {
		if (node.hasAttributes() || ref.hasAttributes()) morphAttributes(node, ref, context);
		if (isHead(node) && isHead(ref)) {
			const refChildNodes: Map<string, ReadonlyNode<Element>> = new Map();
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

	context.afterNodeMorphed?.({ node, referenceNode: ref as ChildNode });
}

function morphAttributes(element: Element, ref: ReadonlyNode<Element>, context: Context): void {
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
function morphChildNodes(element: Element, ref: ReadonlyNode<Element>, context: Context): void {
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

function updateProperty<N extends Node, P extends keyof N>(node: N, propertyName: P, newValue: N[P], context: Context): void {
	const previousValue = node[propertyName];
	if (previousValue !== newValue && (context.beforePropertyUpdated?.({ node, propertyName, newValue }) ?? true)) {
		node[propertyName] = newValue;
		context.afterPropertyUpdated?.({ node, propertyName, previousValue });
	}
}

function morphChildNode(child: ChildNode, ref: ReadonlyNode<ChildNode>, parent: Element, context: Context): void {
	if (isElement(child) && isElement(ref)) morphChildElement(child, ref, parent, context);
	else morphNode(child, ref, context);
}

function morphChildElement(child: Element, ref: ReadonlyNode<Element>, parent: Element, context: Context): void {
	const refIdSet = context.idMap.get(ref);

	// Generate the array in advance of the loop
	const refSetArray = refIdSet ? [...refIdSet] : [];

	let currentNode: ChildNode | null = child;
	let nextMatchByTagName: ChildNode | null = null;

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

function replaceNode(node: ChildNode, newNode: Node, context: Context): void {
	if (
		(context.beforeNodeRemoved?.({ oldNode: node }) ?? true) &&
		(context.beforeNodeAdded?.({ newNode, parentNode: node.parentNode }) ?? true)
	) {
		node.replaceWith(newNode);
		context.afterNodeAdded?.({ newNode });
		context.afterNodeRemoved?.({ oldNode: node });
	}
}

function appendChild(node: ParentNode, newNode: Node, context: Context): void {
	if (context.beforeNodeAdded?.({ newNode, parentNode: node }) ?? true) {
		node.appendChild(newNode);
		context.afterNodeAdded?.({ newNode });
	}
}

function removeNode(node: ChildNode, context: Context): void {
	if (context.beforeNodeRemoved?.({ oldNode: node }) ?? true) {
		node.remove();
		context.afterNodeRemoved?.({ oldNode: node });
	}
}

// We cannot use `instanceof` when nodes might be from different documents,
// so we use type guards instead. This keeps TypeScript happy, while doing
// the necessary checks at runtime.

function isText(node: Node): node is Text;
function isText(node: ReadonlyNode<Node>): node is ReadonlyNode<Text>;
function isText(node: Node | ReadonlyNode<Node>): boolean {
	return node.nodeType === 3;
}

function isComment(node: Node): node is Comment;
function isComment(node: ReadonlyNode<Node>): node is ReadonlyNode<Comment>;
function isComment(node: Node | ReadonlyNode<Node>): boolean {
	return node.nodeType === 8;
}

function isElement(node: Node): node is Element;
function isElement(node: ReadonlyNode<Node>): node is ReadonlyNode<Element>;
function isElement(node: Node | ReadonlyNode<Node>): boolean {
	return node.nodeType === 1;
}

function isInput(element: Element): element is HTMLInputElement;
function isInput(element: ReadonlyNode<Element>): element is ReadonlyNode<HTMLInputElement>;
function isInput(element: Element | ReadonlyNode<Element>): boolean {
	return element.localName === "input";
}

function isOption(element: Element): element is HTMLOptionElement;
function isOption(element: ReadonlyNode<Element>): element is ReadonlyNode<HTMLOptionElement>;
function isOption(element: Element | ReadonlyNode<Element>): boolean {
	return element.localName === "option";
}

function isTextArea(element: Element): element is HTMLTextAreaElement;
function isTextArea(element: ReadonlyNode<Element>): element is ReadonlyNode<HTMLTextAreaElement>;
function isTextArea(element: Element | ReadonlyNode<Element>): boolean {
	return element.localName === "textarea";
}

function isHead(element: Element): element is HTMLHeadElement;
function isHead(element: ReadonlyNode<Element>): element is ReadonlyNode<HTMLHeadElement>;
function isHead(element: Element | ReadonlyNode<Element>): boolean {
	return element.localName === "head";
}

function isParentNode(node: Node): node is ParentNode;
function isParentNode(node: ReadonlyNode<Node>): node is ReadonlyNode<ParentNode>;
function isParentNode(node: Node | ReadonlyNode<Node>): boolean {
	return node.nodeType === 1 || node.nodeType === 9 || node.nodeType === 11;
}
