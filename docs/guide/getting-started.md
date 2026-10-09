# Getting started

## Installation

Install prosemirror-remark together with prosemirror-unified and the ProseMirror packages it works with:

::: code-group

```sh [npm]
npm install prosemirror-remark prosemirror-unified prosemirror-model prosemirror-state prosemirror-view
```

```sh [pnpm]
pnpm add prosemirror-remark prosemirror-unified prosemirror-model prosemirror-state prosemirror-view
```

```sh [yarn]
yarn add prosemirror-remark prosemirror-unified prosemirror-model prosemirror-state prosemirror-view
```

:::

prosemirror-unified, prosemirror-model and prosemirror-state are peer dependencies, so your project shares one copy of them with prosemirror-remark.

## Setting up an editor

Create a `ProseMirrorUnified` adapter with `MarkdownExtension`, then use it to build the editor:

```ts
import { MarkdownExtension } from "prosemirror-remark";
import { EditorState } from "prosemirror-state";
import { ProseMirrorUnified } from "prosemirror-unified";
import { EditorView } from "prosemirror-view";

const pmu = new ProseMirrorUnified([new MarkdownExtension()]);

const view = new EditorView(document.querySelector("#editor")!, {
  state: EditorState.create({
    doc: pmu.parse("# Hello\n\nThis is **Markdown**."),
    plugins: [pmu.inputRulesPlugin(), pmu.keymapPlugin()],
    schema: pmu.schema(),
  }),
  nodeViews: pmu.nodeViews(),
  dispatchTransaction: (tr): void => {
    view.updateState(view.state.apply(tr));
    console.log(pmu.serialize(view.state.doc));
  },
});
```

The adapter gives you everything the editor needs:

- `schema()`: the ProseMirror schema with every node and mark the extensions provide.
- `parse(markdown)`: turns a Markdown string into a ProseMirror document, here used for the initial content.
- `serialize(doc)`: turns the editor's document back into Markdown, here logged on every change.
- `inputRulesPlugin()` and `keymapPlugin()`: plugins with the extensions' [input rules and keyboard shortcuts](/reference/extensions), such as typing `## ` to start a heading or pressing `Mod-b` for bold.
- `nodeViews()`: the extensions' node views. `MarkdownExtension` has none, but [GFM task lists](/guide/gfm) need one for their clickable checkboxes, so it's worth passing them from the start.

See the [prosemirror-unified API reference](https://marekdedic.github.io/prosemirror-unified/guide/api) for details on each method.

## Styling

The editor renders plain HTML elements (`p`, `h1`–`h6`, `strong`, `ul`, …), so it looks like whatever your page's CSS makes those elements look like. You should also load ProseMirror's own stylesheet, `prosemirror-view/style/prosemirror.css`, as with any ProseMirror editor.

Elements that need more than a plain tag, such as [task list items](/guide/gfm#task-list-checkboxes), carry classes starting with `prosemirror-remark-` and `data-*` attributes for their state, but no inline styles. prosemirror-remark ships an optional stylesheet with sensible defaults for them:

```ts
import "prosemirror-remark/style.css";
```

Its rules use only these classes and are easy to override with your own CSS. You can also skip it and style the elements yourself.

## Next steps

- [GitHub Flavored Markdown](/guide/gfm): add strikethrough, task lists and extended autolinks.
- [Markdown output and limitations](/guide/markdown-output): what the Markdown from `serialize` looks like.
