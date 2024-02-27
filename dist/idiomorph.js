import { morph } from "./morphlex";
export class Idiomorph {
	static morph(node, referenceNode, options = {}) {
		const idiomorph = new Idiomorph(node, referenceNode, options);
		idiomorph.morph();
	}
	constructor(node, referenceNode, options) {
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
	get morphlexOptions() {
		return {
			ignoreActiveValue: this.idiomorphOptions.ignoreActiveValue,
			beforeNodeAdded: this.beforeNodeAdded,
			afterNodeAdded: this.afterNodeAdded,
			beforeNodeMorphed: this.beforeNodeMorphed,
			afterNodeMorphed: this.afterNodeMorphed,
			beforeAttributeUpdated: this.beforeAttributeUpdated,
		};
	}
	get beforeNodeAdded() {
		if (this.idiomorphOptions.callbacks?.beforeNodeAdded)
			return ({ newNode, parentNode }) => {
				return this.idiomorphOptions.callbacks?.beforeNodeAdded?.(newNode) ?? true;
			};
	}
	get afterNodeAdded() {
		if (this.idiomorphOptions.callbacks?.afterNodeAdded)
			return ({ newNode }) => {
				this.idiomorphOptions.callbacks?.afterNodeAdded?.(newNode);
			};
	}
	get beforeNodeMorphed() {
		if (this.idiomorphOptions.ignoreActive)
			return ({ node, referenceNode }) => {
				if (document.activeElement === node) return false;
				return this.idiomorphOptions.callbacks?.beforeNodeMorphed?.(node, referenceNode) ?? true;
			};
		if (this.idiomorphOptions.callbacks?.beforeNodeMorphed)
			return ({ node, referenceNode }) => {
				return this.idiomorphOptions.callbacks?.beforeNodeMorphed?.(node, referenceNode) ?? true;
			};
	}
	get afterNodeMorphed() {
		if (this.idiomorphOptions.callbacks?.afterNodeMorphed)
			return ({ node, referenceNode }) => {
				this.idiomorphOptions.callbacks?.afterNodeMorphed?.(node, referenceNode);
			};
	}
	get beforeAttributeUpdated() {
		if (this.idiomorphOptions.callbacks?.beforeAttributeUpdated)
			return ({ element, attributeName, newValue }) => {
				return (
					this.idiomorphOptions.callbacks?.beforeAttributeUpdated?.(attributeName, element, newValue ? "updated" : "removed") ??
					true
				);
			};
	}
}
Idiomorph.defaults = {
	head: "merge",
	morphStyle: "innerHTML",
	ignoreActive: false,
	ignoreActiveValue: false,
};
//# sourceMappingURL=idiomorph.js.map
