# GitHub Flavored Markdown

To support [GitHub Flavored Markdown](https://github.github.com/gfm/) (GFM), use `GFMExtension` instead of `MarkdownExtension`:

```ts
import { GFMExtension } from "prosemirror-remark";
import { ProseMirrorUnified } from "prosemirror-unified";

const pmu = new ProseMirrorUnified([new GFMExtension()]);
```

`GFMExtension` includes everything in `MarkdownExtension`, plus:

| Extension                   | Syntax                                                                      |
| --------------------------- | --------------------------------------------------------------------------- |
| `StrikethroughExtension`    | `~~strikethrough~~`                                                         |
| `TaskListItemExtension`     | `- [ ] task list items` and `- [x] completed ones`                          |
| `ExtendedAutolinkExtension` | Links without angle brackets, such as `www.example.com` or `https://example.com` |

See [Extensions](/reference/extensions#gfm-extensions) for their input rules and keyboard shortcuts.

## Task list checkboxes

Task list items render a checkbox that users can click to check or uncheck the item. This is done by a node view, so pass `pmu.nodeViews()` to your `EditorView` as shown in [Getting started](/guide/getting-started). Without it, the checkboxes are shown but can't be clicked.

To place the checkbox where the list bullet would be, load the default stylesheet, `prosemirror-remark/style.css`, or write your own rules for the `prosemirror-remark-task-list-item` classes (see [Styling](/guide/getting-started#styling)).

## Not supported

Tables aren't supported yet. Table syntax is kept as plain paragraph text, so it survives a round trip but isn't editable as a table. See [Markdown output and limitations](/guide/markdown-output) for other differences.
