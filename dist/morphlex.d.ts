type ObjectKey = string | number | symbol;
export interface Options {
	ignoreActiveValue?: boolean;
	preserveModifiedValues?: boolean;
	beforeNodeMorphed?: ({ node, referenceNode }: { node: Node; referenceNode: Node }) => boolean;
	afterNodeMorphed?: ({ node }: { node: Node }) => void;
	beforeNodeAdded?: ({ newNode, parentNode }: { newNode: Node; parentNode: ParentNode | null }) => boolean;
	afterNodeAdded?: ({ newNode }: { newNode: Node }) => void;
	beforeNodeRemoved?: ({ oldNode }: { oldNode: Node }) => boolean;
	afterNodeRemoved?: ({ oldNode }: { oldNode: Node }) => void;
	beforeAttributeUpdated?: ({
		attributeName,
		newValue,
		element,
	}: {
		attributeName: string;
		newValue: string;
		element: Element;
	}) => boolean;
	afterAttributeUpdated?: ({
		attributeName,
		previousValue,
		element,
	}: {
		attributeName: string;
		previousValue: string | null;
		element: Element;
	}) => void;
	beforePropertyUpdated?: ({
		propertyName,
		newValue,
		node,
	}: {
		propertyName: ObjectKey;
		newValue: unknown;
		node: Node;
	}) => boolean;
	afterPropertyUpdated?: ({
		propertyName,
		previousValue,
		node,
	}: {
		propertyName: ObjectKey;
		previousValue: unknown;
		node: Node;
	}) => void;
}
export declare function morph(node: ChildNode, reference: ChildNode, options?: Options): void;
export {};
