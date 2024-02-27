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
        }
        else {
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
            beforePropertyUpdated: this.beforePropertyUpdated,
        };
    }
    get beforeNodeAdded() {
        const idiomorphCallback = this.idiomorphOptions.callbacks?.beforeNodeAdded;
        if (idiomorphCallback)
            return ({ newNode, parentNode }) => {
                return idiomorphCallback(newNode) ?? true;
            };
    }
    get afterNodeAdded() {
        const idiomorphCallback = this.idiomorphOptions.callbacks?.afterNodeAdded;
        if (idiomorphCallback)
            return ({ newNode }) => {
                idiomorphCallback(newNode);
            };
    }
    get beforeNodeMorphed() {
        const idiomorphCallback = this.idiomorphOptions.callbacks?.beforeNodeMorphed;
        if (this.idiomorphOptions.ignoreActive)
            return ({ node, referenceNode }) => {
                if (document.activeElement === node)
                    return false;
                return idiomorphCallback?.(node, referenceNode) ?? true;
            };
        if (idiomorphCallback)
            return ({ node, referenceNode }) => {
                return idiomorphCallback(node, referenceNode) ?? true;
            };
    }
    get afterNodeMorphed() {
        const idiomorphCallback = this.idiomorphOptions.callbacks?.afterNodeMorphed;
        if (idiomorphCallback)
            return ({ node, referenceNode }) => {
                idiomorphCallback(node, referenceNode);
            };
    }
    get beforeAttributeUpdated() {
        const idiomorphCallback = this.idiomorphOptions.callbacks?.beforeAttributeUpdated;
        if (idiomorphCallback)
            return ({ element, attributeName, newValue }) => {
                return idiomorphCallback(attributeName, element, newValue ? "updated" : "removed") ?? true;
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