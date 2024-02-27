type ObjectKey = string | number | symbol;
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
export declare function morph(node: ChildNode, reference: ChildNode, options?: Options): void;
export {};
