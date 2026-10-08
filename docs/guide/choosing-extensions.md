# Picking individual extensions

`MarkdownExtension` and `GFMExtension` include every extension this package has. If your editor should only support part of Markdown, you can choose the extensions yourself.

## Subclassing a bundle

The easiest way is to subclass `MarkdownExtension` and override `dependencies()` with the extensions you want:

```ts
import {
  BoldExtension,
  ItalicExtension,
  LinkExtension,
  MarkdownExtension,
  ParagraphExtension,
  RootExtension,
  TextExtension,
} from "prosemirror-remark";
import type { Extension } from "prosemirror-unified";
import { ProseMirrorUnified } from "prosemirror-unified";

class InlineMarkdownExtension extends MarkdownExtension {
  public override dependencies(): Array<Extension> {
    return [
      new ParagraphExtension(),
      new LinkExtension(),
      new ItalicExtension(),
      new BoldExtension(),
      new RootExtension(),
      new TextExtension(),
    ];
  }
}

const pmu = new ProseMirrorUnified([new InlineMarkdownExtension()]);
```

The subclass keeps what `MarkdownExtension` does apart from its list of extensions: it still sets up remark to parse and serialize Markdown, with the same [output formatting](/guide/markdown-output).

To start from the full list and change only part of it, filter or map `super.dependencies()` instead:

```ts
class MarkdownWithoutImagesExtension extends MarkdownExtension {
  public override dependencies(): Array<Extension> {
    return super
      .dependencies()
      .filter(
        (extension) =>
          !(extension instanceof ImageExtension) &&
          !(extension instanceof ImageReferenceExtension),
      );
  }
}
```

Without `MarkdownExtension` (or a subclass of it), nothing sets up remark, and `parse` throws an error. If you want to configure remark yourself, write your own extension that registers `remark-parse` and `remark-stringify` in its `unifiedInitializationHook()`. See [Bundles](/reference/bundles#markdownextension) for what `MarkdownExtension` registers.

## What every editor needs

- **`RootExtension`** and **`TextExtension`** provide the document and its text. Every editor needs both.
- **`ParagraphExtension`** provides paragraphs. In practice every editor needs it too, as it's where text goes by default.

Some extensions bring the extensions they rely on with them, so you don't have to list those:

| Extension                                          | Also includes                               |
| -------------------------------------------------- | ------------------------------------------- |
| `OrderedListExtension`, `UnorderedListExtension`   | `ListItemExtension`                         |
| `ImageReferenceExtension`                          | `DefinitionExtension`, `ImageExtension`     |
| `LinkReferenceExtension`                           | `DefinitionExtension`, `LinkExtension`      |
| `HeadingExtension`                                 | `ParagraphExtension`, `TextExtension`       |
| `ImageExtension`                                   | `ParagraphExtension`                        |
| `CodeBlockExtension`                               | `TextExtension`                             |

Every extension is only included once, however many times it's listed.

`ExtendedAutolinkExtension` turns addresses into links, so it needs `LinkExtension` too. It doesn't include it, so list both. `TaskListItemExtension` makes task items out of list items, so it needs `UnorderedListExtension` or `OrderedListExtension`.

## Order

The order of the extensions matters in a few places:

- **`ParagraphExtension` must come first**, before any other extension that provides a block. The first block in the schema is the one ProseMirror uses by default, for example when the user presses Enter at the end of a heading.
- **`LinkExtension` must come before the other marks** (`BoldExtension`, `ItalicExtension`, `InlineCodeExtension`, `StrikethroughExtension`). Then, when a link and another mark cover the same text, the link is serialized on the outside, as `[**text**](url)` rather than `**[text](url)**`.
- **`ItalicExtension` must come before `BoldExtension`**, so that bold italic text is serialized as `***text***` rather than `**_text_**`.

An extension that's included by another one is placed just before it, so for example listing `HeadingExtension` first puts `ParagraphExtension` first too.
