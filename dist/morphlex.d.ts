interface Options {
	callbacks: Callbacks;
	ignoreActiveValue: boolean;
	preserveModifiedValues: boolean;
}
interface Callbacks {
	beforeNodeMorphed?: (node: Node, referenceNode: Node) => boolean;
	afterNodeMorphed?: (node: Node) => void;
	beforeNodeRemoved?: (oldNode: Node) => boolean;
	afterNodeRemoved?: (oldNode: Node) => void;
	beforeAttributeUpdated?: (attributeName: string, newValue: string, element: Element) => boolean;
	afterAttributeUpdated?: (attributeName: string, previousValue: string | null, element: Element) => void;
	beforePropertyUpdated?: (propertyName: string | number | symbol, newValue: unknown, node: Node) => boolean;
	afterPropertyUpdated?: (propertyName: string | number | symbol, previousValue: unknown, node: Node) => void;
}
export declare function morph(node: ChildNode, reference: ChildNode, opts: Options): void;
export {};
