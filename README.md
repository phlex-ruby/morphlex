# Morphlex

Morphlex is a tiny (1.6KB minified/gzipped), safe, optimal DOM morphing library written in TypeScript. DOM morphing is the process of transforming one DOM tree to reflect another, while preserving the state of the original tree and making as few changes as possible.

Morphlex uses ID Sets — a concept pioneered by Idiomorph — to match nodes with deeply nested identified elements. It also maps out _sensitive_ elements to avoid moving them around.

## ID Sets

Each element is tagged with the set of IDs it contains, allowing for more optimal matching.

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
