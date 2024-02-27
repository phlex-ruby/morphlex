import { morph } from "./morphlex";
export class Idiomorph {
	static morph(node, referenceNode, options = {}) {
		const idiomorph = new Idiomorph(node, referenceNode, options);
		idiomorph.morph();
	}
	constructor(node, referenceNode, options) {
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
	beforeNodeAdded(node) {
		return true;
	}
	beforeNodeMorphed(oldNode, newNode) {
		return true;
	}
}
//# sourceMappingURL=idiomorph.js.map
