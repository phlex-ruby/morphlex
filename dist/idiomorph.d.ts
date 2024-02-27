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
export declare class Idiomorph {
    private node;
    private referenceNode;
    private idiomorphOptions;
    static morph(node: ChildNode, referenceNode: ChildNode, options?: IdiomorphOptions): void;
    constructor(node: ChildNode, referenceNode: ChildNode, options: IdiomorphOptions);
    morph(): void;
    private get morphlexOptions();
    private get beforeNodeAdded();
    private get afterNodeAdded();
    private get beforeNodeMorphed();
    private get afterNodeMorphed();
}
export {};
