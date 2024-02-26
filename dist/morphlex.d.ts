interface Options {
	morphHead: boolean;
	callbacks: Callbacks;
	ignoreActiveValue: boolean;
	preserveModifiedValues: boolean;
}
interface Callbacks {
	beforeNodeMorphed?: (node: Node, referenceNode: Node) => boolean;
	afterNodeMorphed?: (node: Node) => void;
	beforeNodeAdded?: (newNode: Node, parentNode: ParentNode) => boolean;
	afterNodeAdded?: (newNode: Node) => void;
	beforeNodeRemoved?: (oldNode: Node) => boolean;
	afterNodeRemoved?: (oldNode: Node) => void;
	beforeAttributeUpdated?: (attributeName: string, newValue: string, node: Node) => boolean;
	afterAttributeUpdated?: (attributeName: string, previousValue: string, node: Node) => void;
	beforePropertyUpdated?: (propertyName: string, newValue: any, node: Node) => boolean;
	afterPropertyUpdated?: (propertyName: string, previousValue: any, node: Node) => void;
}
export declare function morph(node: ChildNode, reference: ChildNode, opts: Options): void;
export {};
