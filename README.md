# Morphlex

Morphlex is tiny (less than 1KB minified and gzipped), optimal DOM morphing library written in TypeScript. It uses IdSets, inspired by [Idiomorph](https://github.com/bigskysoftware/idiomorph) and `isEqualNode` inspired by [Morphdom](https://github.com/patrick-steele-idem/morphdom). Credit is also due to [Nanomorph](https://github.com/choojs/nanomorph) for their work on input properties.

## Why are we doing this?

We were massively impressed by what HTMZ made possible in just 166 bytes, and we think there’s huge potential combining the HTMZ iframe proxy technique with a tiny DOM morphing function. Our goal is to combine this into a new powerful way to build web applications.

There are three parts:

1. iframe proxies for `prepend`, `append`, `morph` and `replace` operations, targeted by normal HTML links and forms;
2. a tiny DOM morphing function that can handle complex cases;
3. a protocol for requesting the server return a specific fragment of a view by DOM id.

Initially, we will build support for rendering fragments into [phlex](https://github.com/phlex-ruby/phlex) and [phlex-rails](https://github.com/phlex-ruby/phlex-rails).

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
