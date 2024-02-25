# Morphlex

Morphlex is an attempt to create a DOM morphing function in less than 100 lines of code with no runtime dependencies, to use with [HTMZ](https://leanrada.com/htmz/) in small projects. It is still very much a work-in-progress.

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

morph(currentNode, guideNode);
```

## Run tests

- `npm install`
- `npm watch`
- in another tab `npm run "test:watch"`
