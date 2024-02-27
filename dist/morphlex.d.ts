type ObjectKey = string | number | symbol;
interface Options {
	ignoreActiveValue?: boolean;
	preserveModifiedValues?: boolean;
	beforeNodeMorphed?: (node: Node, referenceNode: Node) => boolean;
	afterNodeMorphed?: (node: Node) => void;
	beforeNodeAdded?: (newNode: Node, parentNode: ParentNode | null) => boolean;
	afterNodeAdded?: (newNode: Node) => void;
	beforeNodeRemoved?: (oldNode: Node) => boolean;
	afterNodeRemoved?: (oldNode: Node) => void;
	beforeAttributeUpdated?: (attributeName: string, newValue: string, element: Element) => boolean;
	afterAttributeUpdated?: (attributeName: string, previousValue: string | null, element: Element) => void;
	beforePropertyUpdated?: (propertyName: ObjectKey, newValue: unknown, node: Node) => boolean;
	afterPropertyUpdated?: (propertyName: ObjectKey, previousValue: unknown, node: Node) => void;
}
export declare function morph(node: ChildNode, reference: ChildNode, options?: Options): void;
export {};
