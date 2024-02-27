import { morph, Options } from "./morphlex";

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

export class Idiomorph {
	private node: ChildNode;
	private referenceNode: ChildNode;
	private idiomorphOptions: IdiomorphOptions;
	public static defaults: IdiomorphOptions = {
		head: "merge",
		morphStyle: "innerHTML",
		ignoreActive: false,
		ignoreActiveValue: false,
	};

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
			throw new Error("outerHTML morphing is not yet implemented");
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
			beforeAttributeUpdated: this.beforeAttributeUpdated,
		};
	}

	private get beforeNodeAdded(): Options["beforeNodeAdded"] {
		const idiomorphCallback = this.idiomorphOptions.callbacks?.beforeNodeAdded;

		if (idiomorphCallback)
			return ({ newNode, parentNode }: { newNode: Node; parentNode: Node | null }) => {
				return idiomorphCallback(newNode) ?? true;
			};
	}

	private get afterNodeAdded(): Options["afterNodeAdded"] {
		const idiomorphCallback = this.idiomorphOptions.callbacks?.afterNodeAdded;

		if (idiomorphCallback)
			return ({ newNode }: { newNode: Node }) => {
				idiomorphCallback(newNode);
			};
	}

	private get beforeNodeMorphed(): Options["beforeNodeMorphed"] {
		const idiomorphCallback = this.idiomorphOptions.callbacks?.beforeNodeMorphed;

		if (this.idiomorphOptions.ignoreActive)
			return ({ node, referenceNode }: { node: Node; referenceNode: Node }) => {
				if (document.activeElement === node) return false;
				return idiomorphCallback?.(node, referenceNode) ?? true;
			};

		if (idiomorphCallback)
			return ({ node, referenceNode }: { node: Node; referenceNode: Node }) => {
				return idiomorphCallback(node, referenceNode) ?? true;
			};
	}

	private get afterNodeMorphed(): Options["afterNodeMorphed"] {
		const idiomorphCallback = this.idiomorphOptions.callbacks?.afterNodeMorphed;

		if (idiomorphCallback)
			return ({ node, referenceNode }: { node: Node; referenceNode: Node }) => {
				idiomorphCallback(node, referenceNode);
			};
	}

	private get beforeAttributeUpdated(): Options["beforeAttributeUpdated"] {
		const idiomorphCallback = this.idiomorphOptions.callbacks?.beforeAttributeUpdated;

		if (idiomorphCallback)
			return ({ element, attributeName, newValue }: { element: Element; attributeName: string; newValue: string | null }) => {
				return idiomorphCallback(attributeName, element, newValue ? "updated" : "removed") ?? true;
			};
	}
}
