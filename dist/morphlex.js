export function morph(node, guide) {
    const idMap = new Map();
    if (isParentNode(node) && isParentNode(guide)) {
        populateIdSets(node, idMap);
        populateIdSets(guide, idMap);
    }
    morphNodes(node, guide, idMap);
}
function populateIdSets(node, idMap) {
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
function morphNodes(node, guide, idMap, insertBefore, parent) {
    if (parent && insertBefore && insertBefore !== node)
        parent.insertBefore(guide, insertBefore);
    if (isElement(node) && isElement(guide) && node.tagName === guide.tagName) {
        if (!isInput(node) && !isOption(node) && !isTextArea(node) && node.isEqualNode(guide))
            return;
        else {
            if (node.hasAttributes() || guide.hasAttributes())
                morphAttributes(node, guide);
            if (node.hasChildNodes() || guide.hasChildNodes())
                morphChildNodes(node, guide, idMap);
        }
    }
    else {
        if (node.isEqualNode(guide))
            return;
        else if (isText(node) && isText(guide)) {
            if (node.textContent !== guide.textContent)
                node.textContent = guide.textContent;
        }
        else if (isComment(node) && isComment(guide)) {
            if (node.nodeValue !== guide.nodeValue)
                node.nodeValue = guide.nodeValue;
        }
        else
            node.replaceWith(guide.cloneNode(true));
    }
}
function morphAttributes(elem, guide) {
    for (const { name } of elem.attributes)
        guide.hasAttribute(name) || elem.removeAttribute(name);
    for (const { name, value } of guide.attributes)
        elem.getAttribute(name) === value || elem.setAttribute(name, value);
    elem.nodeValue;
    if (isInput(elem) && isInput(guide)) {
        if (elem.checked !== guide.checked)
            elem.checked = guide.checked;
        if (elem.disabled !== guide.disabled)
            elem.disabled = guide.disabled;
        if (elem.indeterminate !== guide.indeterminate)
            elem.indeterminate = guide.indeterminate;
        if (elem.type !== "file" && elem.value !== guide.value)
            elem.value = guide.value;
    }
    else if (isOption(elem) && isOption(guide) && elem.value !== guide.value)
        elem.value = guide.value;
    else if (isTextArea(elem) && isTextArea(guide)) {
        if (elem.value !== guide.value)
            elem.value = guide.value;
        const text = elem.firstChild;
        if (text && text.textContent !== guide.value)
            text.textContent = guide.value;
    }
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
        else if (child)
            child.remove();
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
            if (currentNode.id === guide.id) {
                return morphNodes(currentNode, guide, idMap, child, parent);
            }
            else if (currentNode.id !== "") {
                const currentIdSet = idMap.get(currentNode);
                if (currentIdSet && guideSetArray.some((it) => currentIdSet.has(it))) {
                    return morphNodes(currentNode, guide, idMap, child, parent);
                }
            }
            else if (!nextMatchByTagName && currentNode.tagName === guide.tagName) {
                nextMatchByTagName = currentNode;
            }
        }
        currentNode = currentNode.nextSibling;
    }
    if (nextMatchByTagName)
        morphNodes(nextMatchByTagName, guide, idMap, child, parent);
    else
        child.replaceWith(guide.cloneNode(true));
}
function isText(node) {
    return node.nodeType === 3;
}
function isComment(node) {
    return node.nodeType === 8;
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
function isParentNode(node) {
    return node.nodeType === 1 || node.nodeType === 9 || node.nodeType === 11;
}
//# sourceMappingURL=morphlex.js.map