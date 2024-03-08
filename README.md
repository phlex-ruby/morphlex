# Morphlex

Morphlex is a tiny, safe, optimal DOM morphing library written in TypeScript.

## ID Sets

Inspired by Idiomorph, Morphlex uses ID Sets to match nodes with deeply nested identified elements. Each element is tagged with the set of IDs it contains, allowing for more optimal matching.

Failing an ID Set match, Morphlex will search for the next best match by tag name. If no element can be found, the reference element will be deeply cloned.

## Node sensitivity

Simply moving certain elements in the DOM tree can cause issues. To account for this, Morphlex gives priority to sensitive elements, moving less sensitive elements around them whenever possible.

This works in any direction, even if the sensitive element is deeply nested.

## Usage

```javascript
import { morph } from "morphlex";

morph(currentNode, referenceNode);
```

The `currentNode` will be morphed into the state of the `referenceNode`. The `referenceNode` will not be mutated in this process.
