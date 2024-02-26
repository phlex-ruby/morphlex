type IdSet = Set<string>;
type IdMap = WeakMap<ReadonlyNode<Node>, IdSet>;

// Maps to a type that can only read properties
type StrongReadonly<T> = {
	readonly [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

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

interface Options {
	callbacks: Callbacks;
	ignoreActiveValue: boolean;
	preserveModifiedValues: boolean;
}

interface Callbacks {
	beforeNodeMorphed?: (node: Node, referenceNode: Node) => boolean;
	afterNodeMorphed?: (node: Node) => void;

	// beforeNodeAdded?: (newNode: Node, parentNode: ParentNode) => boolean;
	// afterNodeAdded?: (newNode: Node) => void;

	beforeNodeRemoved?: (oldNode: Node) => boolean;
	afterNodeRemoved?: (oldNode: Node) => void;

	beforeAttributeUpdated?: (attributeName: string, newValue: string, element: Element) => boolean;
	afterAttributeUpdated?: (attributeName: string, previousValue: string | null, element: Element) => void;

	beforePropertyUpdated?: (propertyName: string | number | symbol, newValue: unknown, node: Node) => boolean;
	afterPropertyUpdated?: (propertyName: string | number | symbol, previousValue: unknown, node: Node) => void;
}

export function morph(node: ChildNode, reference: ChildNode, opts: Options): void {
	const readonlyReference = reference as ReadonlyNode<ChildNode>;
	const idMap: IdMap = new WeakMap();

	if (isParentNode(node) && isParentNode(readonlyReference)) {
		populateIdSets(node, idMap);
		populateIdSets(readonlyReference, idMap);
	}

	morphNodes(node, readonlyReference, idMap, opts);
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

// This is where we actually morph the nodes. The `morph` function exists to set up the `idMap`.
function morphNodes(node: ChildNode, ref: ReadonlyNode<ChildNode>, idMap: IdMap, opts: Options): void {
	if (isElement(node) && isElement(ref) && node.tagName === ref.tagName) {
		if (node.hasAttributes() || ref.hasAttributes()) morphAttributes(node, ref, opts);
		if (isHead(node) && isHead(ref)) {
			const refChildNodes: Map<string, ReadonlyNode<Element>> = new Map();
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

function morphAttributes(elm: Element, ref: ReadonlyNode<Element>, opts: Options): void {
	// Remove any excess attributes from the element that aren’t present in the reference.
	for (const { name } of elm.attributes) ref.hasAttribute(name) || elm.removeAttribute(name);

	// Copy attributes from the reference to the element, if they don’t already match.
	for (const { name, value } of ref.attributes) {
		const previousValue = elm.getAttribute(name);
		if (previousValue !== value && (opts.callbacks.beforeAttributeUpdated?.(name, value, elm) ?? true)) {
			elm.setAttribute(name, value);
			opts.callbacks.afterAttributeUpdated?.(name, previousValue, elm);
		}
	}

	// For certain types of elements, we need to do some extra work to ensure
	// the element’s state matches the reference elements’ state.
	if (isInput(elm) && isInput(ref)) {
		updateProperty(elm, "checked", ref.checked, opts);
		updateProperty(elm, "disabled", ref.disabled, opts);
		updateProperty(elm, "indeterminate", ref.indeterminate, opts);
		if (
			elm.type !== "file" &&
			!(opts.ignoreActiveValue && document.activeElement === elm) &&
			!(opts.preserveModifiedValues && elm.value !== elm.defaultValue)
		)
			updateProperty(elm, "value", ref.value, opts);
	} else if (isOption(elm) && isOption(ref)) updateProperty(elm, "selected", ref.selected, opts);
	else if (isTextArea(elm) && isTextArea(ref)) {
		updateProperty(elm, "value", ref.value, opts);

		// TODO: Do we need this? If so, how do we integrate with the callback?
		const text = elm.firstChild;
		if (text && isText(text) && text.textContent !== ref.value) text.textContent = ref.value;
	}
}

function updateProperty<E extends Element, P extends keyof E>(
	element: E,
	propertyName: P,
	newValue: E[P],
	opts: Options,
): void {
	const previousValue = element[propertyName];
	if (previousValue !== newValue && (opts.callbacks.beforePropertyUpdated?.(propertyName, newValue, element) ?? true)) {
		element[propertyName] = newValue;
		opts.callbacks.afterPropertyUpdated?.(propertyName, previousValue, element);
	}
}

// Iterates over the child nodes of the reference element, morphing the main element’s child nodes to match.
function morphChildNodes(element: Element, ref: ReadonlyNode<Element>, idMap: IdMap, opts: Options): void {
	const childNodes = [...element.childNodes];
	const refChildNodes = [...ref.childNodes];

	for (let i = 0; i < refChildNodes.length; i++) {
		const child = childNodes.at(i);
		const refChild = refChildNodes.at(i);

		if (child && refChild) morphChildNode(child, refChild, element, idMap, opts);
		else if (refChild) {
			element.appendChild(refChild.cloneNode(true));
		} else if (child && (opts.callbacks.beforeNodeRemoved?.(child) ?? true)) {
			child.remove();
			opts.callbacks.afterNodeRemoved?.(child);
		}
	}

	// Remove any excess child nodes from the main element. This is separate because
	// the loop above might modify the length of the main element’s child nodes.
	while (element.childNodes.length > ref.childNodes.length) element.lastChild?.remove();
}

function morphChildNode(
	child: ChildNode,
	ref: ReadonlyNode<ChildNode>,
	parent: Element,
	idMap: IdMap,
	opts: Options,
): void {
	if (isElement(child) && isElement(ref)) morphChildElement(child, ref, parent, idMap, opts);
	else morphNodes(child, ref, idMap, opts);
}

function morphChildElement(
	child: Element,
	ref: ReadonlyNode<Element>,
	parent: Element,
	idMap: IdMap,
	opts: Options,
): void {
	const refIdSet = idMap.get(ref);

	// Generate the array in advance of the loop
	const refSetArray = refIdSet ? [...refIdSet] : [];

	let currentNode: ChildNode | null = child;
	let nextMatchByTagName: ChildNode | null = null;

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
