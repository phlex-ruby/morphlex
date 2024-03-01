# Morphlex

Morphlex is a tiny, safe, optimal DOM morphing library written in TypeScript.

> [!WARNING]
> Morphlex is currently in development and it not yet ready for production use.

## ID Sets

Inspired by Idiomorph, Morphlex uses ID Sets to match nodes with deeply nested identified elements.

## Node sensitivity

Morphlex will give priority to sensitive elements such as iframes, media players, and form inputs, forcing less sensitive elements to move around them. This works in any direction even if the sensitive element is deeply nested.

## Streaming morph [WIP]

Because the Morphlex algorithm works depth-first, sequentially through reference DOM, it should be able to consume a stream of reference nodes, morphing the target DOM in real-time. This feature is not yet implemented.

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
