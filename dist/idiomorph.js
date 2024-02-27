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
            // TODO: Need to implement outerHTML morphing via NodeListOf<ChildNode>
            // morph(this.node, this.referenceNode.childNodes, this.morphlexOptions);
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
                if (document.activeElement === node)
                    return false;
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
}
//# sourceMappingURL=idiomorph.js.map