interface IdiomorphOptions {
	head?: "merge" | "morph" | "merge" | "append";
	morphStyle?: "innerHTML" | "outerHTML";
	ignoreActive?: boolean;
	ignoreActiveValue?: boolean;
	callbacks?: {
		beforeNodeAdded?: (node: Node) => boolean;
		afterNodeAdded?: (node: Node) => void;
		beforeNodeMorphed?: (oldNode: Node, newNode: Node) => boolean;
		afterNodeMorphed?: (oldNode: Node, newNode: Node) => void;
		beforeNodeRemoved?: (node: Node) => boolean;
		afterNodeRemoved?: (node: Node) => void;
		beforeAttributeUpdated?: (attributeName: string, node: Node, mutationType: "updated" | "removed") => boolean;
	};
}
export declare class Idiomorph {
	private node;
	private referenceNode;
	private idiomorphOptions;
	static defaults: IdiomorphOptions;
	static morph(node: ChildNode, referenceNode: ChildNode, options?: IdiomorphOptions): void;
	constructor(node: ChildNode, referenceNode: ChildNode, options: IdiomorphOptions);
	morph(): void;
	private get morphlexOptions();
	private get beforeNodeAdded();
	private get afterNodeAdded();
	private get beforeNodeMorphed();
	private get afterNodeMorphed();
	private get beforeAttributeUpdated();
}
export {};
