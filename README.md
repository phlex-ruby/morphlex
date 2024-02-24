# MorphLite

Morphlite is an attempt to create a DOM morphing function in less than 100 lines of code with no runtime dependencies, to use with [HTMZ](https://leanrada.com/htmz/) in small projects. It is still very much a work-in-progress.

## Why are we doing this?

We were massively impressed by what [HTMZ](https://leanrada.com/htmz/) made possible in just 166 bytes, and we think there’s huge potential combining the HTMZ iframe proxy technique with a tiny DOM morphing function. Our goal is to combine this into a new powerful way to build web applications.

There are three parts:

1. iframe proxies for `prepend`, `append` and `morph` operations, targetted by normal HTML links and forms;
2. a tiny DOM morphing function that can handle complex cases;
3. a protocol for requesting the server return a specific fragment of a view by DOM id.

Initially, we will build support for rendering fragments into [phlex](https://github.com/phlex-ruby/phlex) and [phlex-rails](https://github.com/phlex-ruby/phlex-rails).

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
