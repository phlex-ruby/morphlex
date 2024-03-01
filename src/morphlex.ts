type IdSet = Set<string>;
type IdMap = WeakMap<ReadonlyNode<Node>, IdSet>;
type SensivityMap = WeakMap<ReadonlyNode<Node>, number>;
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

export function morph(node: ChildNode, reference: ChildNode, options: Options = {}): void {
	new Morph(options).morph(node, reference);
}

class Morph {
	readonly #options: Options;
	readonly #idMap: IdMap;
	readonly #sensivityMap: SensivityMap;

	constructor(options: Options = {}) {
		this.#options = options;
		this.#idMap = new WeakMap();
		this.#sensivityMap = new WeakMap();
	}

	morph(node: ChildNode, reference: ChildNode): void {
		const readonlyReference = reference as ReadonlyNode<ChildNode>;

		if (isParentNode(node) && isParentNode(readonlyReference)) {
			this.#populateIdSets(node);
			this.#populateIdSets(readonlyReference);
			this.#populateSensivityMap(node);
		}

		this.#morphNode(node, readonlyReference);
	}

	#populateSensivityMap(node: ReadonlyNode<ParentNode>): void {
		const sensitiveElements = node.querySelectorAll("audio,canvas,embed,iframe,input,object,textarea,video");
		for (const sensitiveElement of sensitiveElements) {
			let sensivity = 0;

			if (isInput(sensitiveElement) || isTextArea(sensitiveElement)) {
				sensivity += 1;

				if (sensitiveElement.value !== sensitiveElement.defaultValue) sensivity += 1;
				if (sensitiveElement === document.activeElement) sensivity += 1;
			} else {
				sensivity += 3;

				if (isMedia(sensitiveElement) && !sensitiveElement.ended) {
					if (!sensitiveElement.paused) sensivity += 1;
					if (sensitiveElement.currentTime > 0) sensivity += 1;
				}
			}

			let current: ReadonlyNode<Element> | null = sensitiveElement;
			while (current) {
				this.#sensivityMap.set(current, (this.#sensivityMap.get(current) || 0) + sensivity);
				if (current === node) break;
				current = current.parentElement;
			}
		}
	}

	// For each node with an ID, push that ID into the IdSet on the IdMap, for each of its parent elements.
	#populateIdSets(node: ReadonlyNode<ParentNode>): void {
		const elementsWithIds = node.querySelectorAll("[id]");

		for (const elementWithId of elementsWithIds) {
			const id = elementWithId.id;

			// Ignore empty IDs
			if (id === "") continue;

			let current: ReadonlyNode<Element> | null = elementWithId;

			while (current) {
				const idSet: IdSet | undefined = this.#idMap.get(current);
				idSet ? idSet.add(id) : this.#idMap.set(current, new Set([id]));
				if (current === node) break;
				current = current.parentElement;
			}
		}
	}

	// This is where we actually morph the nodes. The `morph` function (above) exists only to set up the `idMap`.
	#morphNode(node: ChildNode, ref: ReadonlyNode<ChildNode>): void {
		if (!(this.#options.beforeNodeMorphed?.({ node, referenceNode: ref as ChildNode }) ?? true)) return;

		if (isElement(node) && isElement(ref) && node.localName === ref.localName) {
			if (node.hasAttributes() || ref.hasAttributes()) this.#morphAttributes(node, ref);
			if (isHead(node) && isHead(ref)) {
				const refChildNodes: Map<string, ReadonlyNode<Element>> = new Map();
				for (const child of ref.children) refChildNodes.set(child.outerHTML, child);
				for (const child of node.children) {
					const key = child.outerHTML;
					const refChild = refChildNodes.get(key);
					refChild ? refChildNodes.delete(key) : this.#removeNode(child);
				}
				for (const refChild of refChildNodes.values()) this.#appendChild(node, refChild.cloneNode(true));
			} else if (node.hasChildNodes() || ref.hasChildNodes()) this.#morphChildNodes(node, ref);
		} else {
			if (isText(node) && isText(ref)) {
				this.#updateProperty(node, "textContent", ref.textContent);
			} else if (isComment(node) && isComment(ref)) {
				this.#updateProperty(node, "nodeValue", ref.nodeValue);
			} else this.#replaceNode(node, ref.cloneNode(true));
		}

		this.#options.afterNodeMorphed?.({ node, referenceNode: ref as ChildNode });
	}

	#morphAttributes(element: Element, ref: ReadonlyNode<Element>): void {
		// Remove any excess attributes from the element that aren’t present in the reference.
		for (const { name, value } of element.attributes) {
			if (
				!ref.hasAttribute(name) &&
				(this.#options.beforeAttributeUpdated?.({ element, attributeName: name, newValue: null }) ?? true)
			) {
				element.removeAttribute(name);
				this.#options.afterAttributeUpdated?.({ element, attributeName: name, previousValue: value });
			}
		}

		// Copy attributes from the reference to the element, if they don’t already match.
		for (const { name, value } of ref.attributes) {
			const previousValue = element.getAttribute(name);
			if (
				previousValue !== value &&
				(this.#options.beforeAttributeUpdated?.({ element, attributeName: name, newValue: value }) ?? true)
			) {
				element.setAttribute(name, value);
				this.#options.afterAttributeUpdated?.({ element, attributeName: name, previousValue });
			}
		}

		// For certain types of elements, we need to do some extra work to ensure
		// the element’s state matches the reference elements’ state.
		if (isInput(element) && isInput(ref)) {
			this.#updateProperty(element, "checked", ref.checked);
			this.#updateProperty(element, "disabled", ref.disabled);
			this.#updateProperty(element, "indeterminate", ref.indeterminate);
			if (
				element.type !== "file" &&
				!(this.#options.ignoreActiveValue && document.activeElement === element) &&
				!(this.#options.preserveModifiedValues && element.value !== element.defaultValue)
			)
				this.#updateProperty(element, "value", ref.value);
		} else if (isOption(element) && isOption(ref)) this.#updateProperty(element, "selected", ref.selected);
		else if (isTextArea(element) && isTextArea(ref)) {
			this.#updateProperty(element, "value", ref.value);

			const text = element.firstChild;
			if (text && isText(text)) this.#updateProperty(text, "textContent", ref.value);
		}
	}

	// Iterates over the child nodes of the reference element, morphing the main element’s child nodes to match.
	#morphChildNodes(element: Element, ref: ReadonlyNode<Element>): void {
		const childNodes = element.childNodes;
		const refChildNodes = ref.childNodes;

		for (let i = 0; i < refChildNodes.length; i++) {
			const child = childNodes[i] as ChildNode | null;
			const refChild = refChildNodes[i]; //as ReadonlyNode<ChildNode> | null;

			if (child && refChild) {
				if (isElement(child) && isElement(refChild)) this.#morphChildElement(child, refChild, element);
				else this.#morphNode(child, refChild);
			} else if (refChild) {
				this.#appendChild(element, refChild.cloneNode(true));
			} else if (child) {
				this.#removeNode(child);
			}
		}

		// Clean up any excess nodes that may be left over
		while (childNodes.length > refChildNodes.length) {
			const child = element.lastChild;
			if (child) this.#removeNode(child);
		}
	}

	#morphChildElement(child: Element, ref: ReadonlyNode<Element>, parent: Element): void {
		const refIdSet = this.#idMap.get(ref);

		// Generate the array in advance of the loop
		const refSetArray = refIdSet ? [...refIdSet] : [];

		let currentNode: ChildNode | null = child;
		let nextMatchByTagName: ChildNode | null = null;

		// Try find a match by idSet, while also looking out for the next best match by tagName.
		while (currentNode) {
			if (isElement(currentNode)) {
				const id = currentNode.id;

				if (!nextMatchByTagName && currentNode.localName === ref.localName) {
					nextMatchByTagName = currentNode;
				}

				if (id !== "") {
					if (id === ref.id) {
						this.#insertBefore(parent, currentNode, child);
						return this.#morphNode(currentNode, ref);
					} else {
						const currentIdSet = this.#idMap.get(currentNode);

						if (currentIdSet && refSetArray.some((it) => currentIdSet.has(it))) {
							this.#insertBefore(parent, currentNode, child);
							return this.#morphNode(currentNode, ref);
						}
					}
				}
			}

			currentNode = currentNode.nextSibling;
		}

		if (nextMatchByTagName) {
			this.#insertBefore(parent, nextMatchByTagName, child);
			this.#morphNode(nextMatchByTagName, ref);
		} else {
			const newNode = ref.cloneNode(true);
			if (this.#options.beforeNodeAdded?.({ newNode, parentNode: parent }) ?? true) {
				this.#insertBefore(parent, newNode, child);
				this.#options.afterNodeAdded?.({ newNode });
			}
		}
	}

	#updateProperty<N extends Node, P extends keyof N>(node: N, propertyName: P, newValue: N[P]): void {
		const previousValue = node[propertyName];
		if (previousValue !== newValue && (this.#options.beforePropertyUpdated?.({ node, propertyName, newValue }) ?? true)) {
			node[propertyName] = newValue;
			this.#options.afterPropertyUpdated?.({ node, propertyName, previousValue });
		}
	}

	#replaceNode(node: ChildNode, newNode: Node): void {
		if (
			(this.#options.beforeNodeRemoved?.({ oldNode: node }) ?? true) &&
			(this.#options.beforeNodeAdded?.({ newNode, parentNode: node.parentNode }) ?? true)
		) {
			node.replaceWith(newNode);
			this.#options.afterNodeAdded?.({ newNode });
			this.#options.afterNodeRemoved?.({ oldNode: node });
		}
	}

	#insertBefore(parent: ParentNode, node: Node, insertionPoint: ChildNode): void {
		if (node === insertionPoint) return;

		if (isElement(node)) {
			const sensitivity = this.#sensivityMap.get(node) ?? 0;

			if (sensitivity > 0) {
				let previousNode = node.previousSibling;

				while (previousNode) {
					const previousNodeSensitivity = this.#sensivityMap.get(previousNode) ?? 0;

					if (previousNodeSensitivity < sensitivity) {
						parent.insertBefore(previousNode, node.nextSibling);

						if (previousNode === insertionPoint) return;
						previousNode = node.previousSibling;
					} else {
						break;
					}
				}
			}
		}

		parent.insertBefore(node, insertionPoint);
	}

	#appendChild(node: ParentNode, newNode: Node): void {
		if (this.#options.beforeNodeAdded?.({ newNode, parentNode: node }) ?? true) {
			node.appendChild(newNode);
			this.#options.afterNodeAdded?.({ newNode });
		}
	}

	#removeNode(node: ChildNode): void {
		if (this.#options.beforeNodeRemoved?.({ oldNode: node }) ?? true) {
			node.remove();
			this.#options.afterNodeRemoved?.({ oldNode: node });
		}
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

function isMedia(element: Element): element is HTMLMediaElement;
function isMedia(element: ReadonlyNode<Element>): element is ReadonlyNode<HTMLMediaElement>;
function isMedia(element: Element | ReadonlyNode<Element>): boolean {
	return element.localName === "video" || element.localName === "audio";
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
