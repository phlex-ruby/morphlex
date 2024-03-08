# Morphlex

Morphlex is a tiny, safe, optimal DOM morphing library written in TypeScript.

## ID Sets

Inspired by Idiomorph, Morphlex uses ID Sets to match nodes with deeply nested identified elements.

## Node sensitivity

Morphlex will give priority to sensitive elements such as iframes, media players, and form inputs, forcing less sensitive elements to move around them. This works in any direction even if the sensitive element is deeply nested.

## Usage

```javascript
import { morph } from "morphlex";

morph(currentNode, referenceNode);
```

The `currentNode` will be morphed into the state of the `referenceNode`. The `referenceNode` will not be mutated in this process.

## Run tests

- `npm install`
- `npm watch`
- in another tab `npm run "test:watch"`
