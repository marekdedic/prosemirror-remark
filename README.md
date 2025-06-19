# prosemirror-remark

[![NPM Version](https://img.shields.io/npm/v/prosemirror-remark?logo=npm)](https://www.npmjs.com/package/prosemirror-remark)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/marekdedic/prosemirror-remark/CI.yml?branch=master&logo=github)](https://github.com/marekdedic/prosemirror-remark/actions/workflows/CI.yml)
[![Coveralls](https://img.shields.io/coverallsCoverage/github/marekdedic/prosemirror-remark?branch=master&logo=coveralls)](https://coveralls.io/github/marekdedic/prosemirror-remark)
[![NPM Downloads](https://img.shields.io/npm/dm/prosemirror-remark?logo=npm)](https://www.npmjs.com/package/prosemirror-remark)
[![NPM License](https://img.shields.io/npm/l/prosemirror-remark)](https://github.com/marekdedic/prosemirror-remark/blob/master/LICENSE)

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

## Manual configuration

If you want finer-grained control over how Markdown is processed and viewed, instead of using `MarkdownExtension`, you can add individual syntax extensions that support particular parts of the Markdown spec:

- `BlockquoteExtension` provides support for `> Block quotes`
- `BoldExtension` provides support for `**bold text**`
- `BreakExtension` provides support for `hard breaks at the end of a line\`
- `CodeBlockExtension` provides support for code blocks like
<!-- eslint-disable-next-line markdown/fenced-code-language -- Markdown example -->
  ````
  ```
  this
  ```
  ````
- `DefinitionExtension` provides support for definitions for reference-style images and links. It is auto-included with `ImageReferenceExtension` and `LinkReferenceExtension`.
- `HeadingExtension` provides support for `## Headings`
- `HorizontalRuleExtension` provides support for horizontal dividers like this: `---`
- `ImageExtension` provides support for images `![Awesome image](https://example.test)`
- `ImageReferenceExtension` provides support for reference style images with the address later in the document like `![Awesome image][imageId]`
- `InlineCodeExtension` provides support for `` `inline code snippets` ``
- `ItalicExtension` provides support for `*italic text*`
- `LinkExtension` provides support for `[links](https://example.test)`
- `LinkReferenceExtension` provides support for reference style links with the address later in the document like `[Click me!](linkId)`
- `ListItemExtension` provides support for individual items in both ordered and unordered lists. It is auto-included with `OrderedListExtension` and `UnorderedListExtension`.
- `OrderedListExtension` provides support for `1. ordered lists`
- `ParagraphExtension` provides support for basic paragraphs in text
- `RootExtension` provides support for the root node of the document. You **need** to include this.
- `TextExtension` provides support for text. You **need** to include this.
- `UnorderedListExtension` provides support for `- unordered lists`

Additionally, you can also augment prosemirror-remark by creating your own extensions - see the [prosemirror-unified documentation](https://github.com/marekdedic/prosemirror-unified/#creating-your-own-extensions) for more details

## GitHub flavored markdown

On top of the standard CommonMark version of markdown, prosemirror-remark can also be used to add support for GitHub flavored markdown (GFM). In order to do this, simply replace `MarkdownExtension` with `GFMExtension`. `GFMExtension` automatically includes standard markdown, as well as the following extensions (which can also be added manually one-by-one):

- `ExtendedLinkExtension` provides support for automatic conversions of addresses starting with `www.` to links.
- `StrikethroughExtension` provides support for `~~text with strikethrough~~`
- `TaskListItemExtension` provides support for `- [ ] Task list items`

Note that tables are currently not supported.
