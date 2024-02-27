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
	static morph(node: ChildNode, referenceNode: ChildNode, options: Options = {}) {
		morph(node, referenceNode);
	}
}
