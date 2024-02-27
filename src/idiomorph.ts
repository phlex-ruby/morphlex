import { morph, Options } from "./morphlex";

type MorphStyle = "innerHTML" | "outerHTML";
type AttributeMutationType = "updated" | "removed";
type HeadMode = "merge" | "morph" | "merge" | "append";

interface IdiomorphOptions {
	morphStyle?: MorphStyle;
	ignoreActive?: boolean;
	ignoreActiveValue?: boolean;
	head?: HeadMode;
	callbacks?: {
		beforeNodeAdded?: (node: Node) => boolean;
		afterNodeAdded?: (node: Node) => void;
		beforeNodeMorphed?: (oldNode: Node, newNode: Node) => boolean;
		afterNodeMorphed?: (oldNode: Node, newNode: Node) => void;
		beforeNodeRemoved?: (node: Node) => boolean;
		afterNodeRemoved?: (node: Node) => void;
		beforeAttributeUpdated?: (attributeName: string, node: Node, mutationType: AttributeMutationType) => boolean;
	};
}

export class Idiomorph {
	private node: ChildNode;
	private referenceNode: ChildNode;
	private idiomorphOptions: IdiomorphOptions;

	static morph(node: ChildNode, referenceNode: ChildNode, options: IdiomorphOptions = {}) {
		const idiomorph = new Idiomorph(node, referenceNode, options);
		idiomorph.morph();
	}

	constructor(node: ChildNode, referenceNode: ChildNode, options: IdiomorphOptions) {
		this.node = node;
		this.referenceNode = referenceNode;
		this.idiomorphOptions = options;
	}

	morph() {
		if (this.idiomorphOptions.morphStyle === "outerHTML") {
			// TODO: Need to implement outerHTML morphing via NodeListOf<ChildNode>
			// morph(this.node, this.referenceNode.childNodes, this.morphlexOptions);
		} else {
			morph(this.node, this.referenceNode, this.morphlexOptions);
		}
	}

	private get morphlexOptions(): Options {
		return {
			ignoreActiveValue: this.idiomorphOptions.ignoreActiveValue,
			beforeNodeAdded: this.beforeNodeAdded,
			afterNodeAdded: this.afterNodeAdded,
			beforeNodeMorphed: this.beforeNodeMorphed,
			afterNodeMorphed: this.afterNodeMorphed,
		};
	}

	private get beforeNodeAdded(): Options["beforeNodeAdded"] {
		if (this.idiomorphOptions.callbacks?.beforeNodeAdded)
			return ({ newNode, parentNode }: { newNode: Node; parentNode: Node | null }) => {
				return this.idiomorphOptions.callbacks?.beforeNodeAdded?.(newNode) ?? true;
			};
	}

	private get afterNodeAdded(): Options["afterNodeAdded"] {
		if (this.idiomorphOptions.callbacks?.afterNodeAdded)
			return ({ newNode }: { newNode: Node }) => {
				this.idiomorphOptions.callbacks?.afterNodeAdded?.(newNode);
			};
	}

	private get beforeNodeMorphed(): Options["beforeNodeMorphed"] {
		if (this.idiomorphOptions.ignoreActive)
			return ({ node, referenceNode }: { node: Node; referenceNode: Node }) => {
				if (document.activeElement === node) return false;
				return this.idiomorphOptions.callbacks?.beforeNodeMorphed?.(node, referenceNode) ?? true;
			};

		if (this.idiomorphOptions.callbacks?.beforeNodeMorphed)
			return ({ node, referenceNode }: { node: Node; referenceNode: Node }) => {
				return this.idiomorphOptions.callbacks?.beforeNodeMorphed?.(node, referenceNode) ?? true;
			};
	}

	private get afterNodeMorphed(): Options["afterNodeMorphed"] {
		if (this.idiomorphOptions.callbacks?.afterNodeMorphed)
			return ({ node, referenceNode }: { node: Node; referenceNode: Node }) => {
				this.idiomorphOptions.callbacks?.afterNodeMorphed?.(node, referenceNode);
			};
	}
}
