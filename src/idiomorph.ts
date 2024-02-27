import { morph } from "./morphlex";

type MorphStyle = "innerHTML" | "outerHTML";
type AttributeMutationType = "updated" | "removed";
type HeadMode = "merge" | "morph" | "merge" | "append";

interface Options {
	morphStyle?: MorphStyle;
	ignoreActive?: boolean;
	ignoreActiveValue?: boolean;
	head?: HeadMode;
	callbacks?: Callbacks;
}

interface Callbacks {
	beforeNodeAdded?: (node: Node) => boolean;
	afterNodeAdded?: (node: Node) => void;

	beforeNodeMorphed?: (oldNode: Node, newNode: Node) => boolean;
	afterNodeMorphed?: (oldNode: Node, newNode: Node) => void;

	beforeNodeRemoved?: (node: Node) => boolean;
	afterNodeRemoved?: (node: Node) => void;

	beforeAttributeUpdated?: (attributeName: string, node: Node, mutationType: AttributeMutationType) => boolean;
}

export class Idiomorph {
	private node: ChildNode;
	private referenceNode: ChildNode;
	private options: Options;

	static morph(node: ChildNode, referenceNode: ChildNode, options: Options = {}) {
		const idiomorph = new Idiomorph(node, referenceNode, options);
		idiomorph.morph();
	}

	constructor(node: ChildNode, referenceNode: ChildNode, options: Options) {
		this.node = node;
		this.referenceNode = referenceNode;
		this.options = options;
	}

	morph() {
		if (this.options.morphStyle === "innerHTML") {
			morph(this.node, this.referenceNode, {
				beforeNodeAdded: this.beforeNodeAdded.bind(this),
				beforeNodeMorphed: this.beforeNodeMorphed.bind(this),
			});
		}
	}

	private beforeNodeAdded(node: Node): boolean {
		return true;
	}

	private beforeNodeMorphed(oldNode: Node, newNode: Node): boolean {
		return true;
	}
}
