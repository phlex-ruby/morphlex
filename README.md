# MorphLite

Morphlite is an attempt to create a DOM morphing function in less than 100 lines of code to use with [HTMZ](https://leanrada.com/htmz/) in small projects. It is still very much a work-in-progress and probably doesn’t work.

## Run tests

- `npm install`
- `npm watch`
- in another tab `npm run "test:watch"`

## Usage

```javascript
import { morph } from "morphlite";

morph(currentNode, guideNode);
```
