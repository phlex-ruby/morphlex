# MorphLite

Morphlite is an attempt to create a DOM morphing function in less than 100 lines of code with no runtime dependencies, to use with [HTMZ](https://leanrada.com/htmz/) in small projects. It is still very much a work-in-progress.

## Current status

We have a basic sketch of the morphing function in `src/morphlite.ts` that can handle simple cases. Now, we’re copying tests from [Morphdom](https://github.com/patrick-steele-idem/morphdom), [Idiomorph](https://github.com/bigskysoftware/idiomorph), [Alpine Morph](https://github.com/alpinejs/alpine/tree/main/packages/morph), and [nanomorph](https://github.com/choojs/nanomorph).

## Run tests

- `npm install`
- `npm watch`
- in another tab `npm run "test:watch"`

## Usage

```javascript
import { morph } from "morphlite";

morph(currentNode, guideNode);
```
