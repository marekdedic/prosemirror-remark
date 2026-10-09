# prosemirror-remark

[![NPM Version](https://img.shields.io/npm/v/prosemirror-remark?logo=npm)](https://www.npmjs.com/package/prosemirror-remark)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/marekdedic/prosemirror-remark/CI.yml?branch=master&logo=github)](https://github.com/marekdedic/prosemirror-remark/actions/workflows/CI.yml)
[![Codecov (with branch)](https://img.shields.io/codecov/c/github/marekdedic/prosemirror-remark/master?logo=codecov)](https://app.codecov.io/gh/marekdedic/prosemirror-remark)
[![NPM Downloads](https://img.shields.io/npm/dm/prosemirror-remark?logo=npm)](https://www.npmjs.com/package/prosemirror-remark)
[![NPM License](https://img.shields.io/npm/l/prosemirror-remark)](https://github.com/marekdedic/prosemirror-remark/blob/master/LICENSE)
[![Documentation](https://img.shields.io/badge/docs-vitepress-blue?logo=vite)](https://marekdedic.github.io/prosemirror-remark/)

This package provides support for using the [remark](https://github.com/remarkjs/remark) Markdown parser with the [ProseMirror](https://prosemirror.net/) editor. prosemirror-remark builds on the [prosemirror-unified](https://github.com/marekdedic/prosemirror-unified) package and offers a configurable and extensible way of adding Markdown support to ProseMirror.

## Documentation

Full documentation, with a guide to using prosemirror-remark, a reference of all the extensions and their keyboard shortcuts, and a guide to extending it, is available at **[marekdedic.github.io/prosemirror-remark](https://marekdedic.github.io/prosemirror-remark/)**.

## Example

```ts
import { MarkdownExtension } from "prosemirror-remark";
import { EditorState } from "prosemirror-state";
import { ProseMirrorUnified } from "prosemirror-unified";
import { EditorView } from "prosemirror-view";
// Optional default styles (task list checkboxes etc.)
import "prosemirror-remark/style.css";

const sourceMarkdown = "**Bold text**";
const pmu = new ProseMirrorUnified([new MarkdownExtension()]);

const view = new EditorView(
  // The element to use for the editor
  document.querySelector("#editor")!,
  {
    state: EditorState.create({
      // Set the initial content of the editor from sourceMarkdown
      doc: pmu.parse(sourceMarkdown),
      plugins: [pmu.inputRulesPlugin(), pmu.keymapPlugin()],
      schema: pmu.schema(),
    }),
    // Add interactive elements (task lists etc.)
    nodeViews: pmu.nodeViews(),
    // Log (in the browser console) the current content in markdown on every update
    dispatchTransaction: (tr): void => {
      view.updateState(view.state.apply(tr));
      console.log(pmu.serialize(view.state.doc));
    },
  }
);
```
