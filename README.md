# prosemirror-remark

![GitHub](https://img.shields.io/github/license/marekdedic/prosemirror-remark)
![GitHub CI](https://img.shields.io/github/actions/workflow/status/marekdedic/prosemirror-remark/CI.yml?logo=github)
![Codecov](https://img.shields.io/codecov/c/github/marekdedic/prosemirror-remark/master?logo=codecov)
![npm downloads](https://img.shields.io/npm/dm/prosemirror-remark?logo=npm)

This package provides support for using the [remark](https://github.com/remarkjs/remark) Markdown parser with the [ProseMirror](https://prosemirror.net/) editor. prosemirror-remark builds on the [prosemirror-unified](https://github.com/marekdedic/prosemirror-unified) package and offers a configurable and extensible way of adding Markdown support to ProseMirror.

## Quickstart

```ts
import { MarkdownExtension } from "prosemirror-remark";
import { EditorState } from "prosemirror-state";
import { ProseMirrorUnified } from "prosemirror-unified";
import { EditorView } from "prosemirror-view";

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
    // Log (in the browser console) the current content in markdown on every update
    dispatchTransaction: (tr): void => {
      view.updateState(view.state.apply(tr));
      console.log(pmu.serialize(view.state.doc));
    },
  }
);
```

The example above shows how to use the `MarkdownExtension` provided by prosemirror-remark to add support for CommonMark markdown.
