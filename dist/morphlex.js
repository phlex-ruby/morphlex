export function morph(node, guide) {
    const idMap = new Map();
    if (isElement(node) && isElement(guide)) {
        populateIdMapForNode(node, idMap);
        populateIdMapForNode(guide, idMap);
    }
    morphNodes(node, guide, idMap);
}
function morphNodes(node, guide, idMap, insertBefore, parent) {
    if (parent && insertBefore && insertBefore !== node)
        parent.insertBefore(guide, insertBefore);
    if (isText(node) && isText(guide)) {
        if (node.textContent !== guide.textContent)
            node.textContent = guide.textContent;
    }
    else if (isElement(node) && isElement(guide) && node.tagName === guide.tagName) {
        if (node.hasAttributes() || guide.hasAttributes())
            morphAttributes(node, guide);
        if (node.hasChildNodes() || guide.hasChildNodes())
            morphChildNodes(node, guide, idMap);
    }
    else
        node.replaceWith(guide.cloneNode(true));
}
function morphAttributes(elem, guide) {
    for (const { name } of elem.attributes)
        guide.hasAttribute(name) || elem.removeAttribute(name);
    for (const { name, value } of guide.attributes)
        elem.getAttribute(name) !== value && elem.setAttribute(name, value);
    if (isInput(elem) && isInput(guide) && elem.value !== guide.value)
        elem.value = guide.value;
    else if (isOption(elem) && isOption(guide) && elem.selected !== guide.selected)
        elem.selected = guide.selected;
    else if (isTextArea(elem) && isTextArea(guide) && elem.value !== guide.value)
        elem.value = guide.value;
}
function morphChildNodes(elem, guide, idMap) {
    const childNodes = [...elem.childNodes];
    const guideChildNodes = [...guide.childNodes];
    for (let i = 0; i < guideChildNodes.length; i++) {
        const child = childNodes.at(i);
        const guideChild = guideChildNodes.at(i);
        if (child && guideChild)
            morphChildNode(child, guideChild, elem, idMap);
        else if (guideChild)
            elem.appendChild(guideChild.cloneNode(true));
    }
    while (elem.childNodes.length > guide.childNodes.length)
        elem.lastChild?.remove();
}
function morphChildNode(child, guide, parent, idMap) {
    if (isElement(child) && isElement(guide))
        morphChildElement(child, guide, parent, idMap);
    else
        morphNodes(child, guide, idMap);
}
function morphChildElement(child, guide, parent, idMap) {
    const guideIdSet = idMap.get(guide);
    const guideSetArray = guideIdSet ? [...guideIdSet] : [];
    let currentNode = child;
    let nextMatchByTagName = null;
    while (currentNode) {
        if (isElement(currentNode)) {
            if (currentNode.id !== "" && currentNode.id === guide.id) {
                return morphNodes(currentNode, guide, idMap, child, parent);
            }
            else {
                const currentIdSet = idMap.get(currentNode);
                if (currentIdSet && guideSetArray.some((it) => currentIdSet.has(it))) {
                    return morphNodes(currentNode, guide, idMap, child, parent);
                }
                else if (!nextMatchByTagName && currentNode.tagName === guide.tagName) {
                    nextMatchByTagName = currentNode;
                }
            }
        }
        currentNode = currentNode.nextSibling;
    }
    if (nextMatchByTagName)
        morphNodes(nextMatchByTagName, guide, idMap, child, parent);
    else
        child.replaceWith(guide.cloneNode(true));
}
function populateIdMapForNode(node, idMap) {
    const elementsWithIds = node.querySelectorAll("[id]");
    for (const elementWithId of elementsWithIds) {
        const id = elementWithId.id;
        if (id === "")
            continue;
        let current = elementWithId;
        while (current) {
            const idSet = idMap.get(current);
            idSet ? idSet.add(id) : idMap.set(current, new Set([id]));
            if (current === elementWithId)
                break;
            current = current.parentElement;
        }
    }
}
function isText(node) {
    return node.nodeType === 3;
}
function isElement(node) {
    return node.nodeType === 1;
}
function isInput(element) {
    return element.localName === "input";
}
function isOption(element) {
    return element.localName === "option";
}
function isTextArea(element) {
    return element.localName === "textarea";
}
//# sourceMappingURL=morphlex.js.map