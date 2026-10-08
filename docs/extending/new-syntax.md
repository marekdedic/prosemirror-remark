# Adding new Markdown syntax

You can add support for Markdown syntax that this package doesn't cover by writing your own extension. How to write an extension in general is covered by prosemirror-unified's [Writing an extension](https://marekdedic.github.io/prosemirror-unified/developing/writing-an-extension) guide; this page covers what's specific to Markdown.

## Teaching remark the syntax

An extension converts between ProseMirror and remark's syntax tree, [mdast](https://github.com/syntax-tree/mdast). If remark already parses the syntax into an mdast node, which is the case for everything in CommonMark, the extension only needs to convert that node.

For syntax beyond CommonMark, remark first needs to be taught to parse and serialize it. This is done by three kinds of plugins, which usually come in pairs of packages:

- A [micromark](https://github.com/micromark/micromark) **syntax extension**, which tokenizes the syntax (for example `micromark-extension-gfm-strikethrough`).
- An mdast **from-markdown extension**, which turns those tokens into mdast nodes (from `mdast-util-gfm-strikethrough`).
- An mdast **to-markdown extension**, which serializes the nodes back to Markdown (also from `mdast-util-gfm-strikethrough`).

remark reads them from the processor's data, so an extension registers them in its `unifiedInitializationHook()`:

```ts
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import {
  gfmStrikethroughFromMarkdown,
  gfmStrikethroughToMarkdown,
} from "mdast-util-gfm-strikethrough";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";

// In your extension class:
public override unifiedInitializationHook(
  processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>,
): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
  const data = processor.data();
  (data.micromarkExtensions ??= []).push(gfmStrikethrough());
  (data.fromMarkdownExtensions ??= []).push(gfmStrikethroughFromMarkdown());
  (data.toMarkdownExtensions ??= []).push(gfmStrikethroughToMarkdown());
  return processor;
}
```

## Example: strikethrough

The GFM extensions in this package are built this way. Here's a simplified version of `StrikethroughExtension`, which turns mdast `delete` nodes into a `strikethrough` mark:

```ts
import type { Delete, PhrasingContent } from "mdast";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import { MarkExtension } from "prosemirror-unified";

export class StrikethroughExtension extends MarkExtension<Delete> {
  public override unistNodeName(): "delete" {
    return "delete";
  }

  public override proseMirrorMarkName(): string {
    return "strikethrough";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
    return {
      parseDOM: [{ tag: "s" }, { tag: "del" }],
      toDOM: (): DOMOutputSpec => ["s", 0],
    };
  }

  public override unistNodeToProseMirrorNodes(
    _node: Delete,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    const mark = proseMirrorSchema.marks[this.proseMirrorMarkName()].create();
    return convertedChildren.map((child) =>
      child.mark(mark.addToSet(child.marks)),
    );
  }

  public override processConvertedUnistNodes(
    convertedNodes: Array<PhrasingContent>,
  ): Delete {
    return { children: convertedNodes, type: this.unistNodeName() };
  }

  // Plus unifiedInitializationHook() from above.
}
```

The [full source](https://github.com/marekdedic/prosemirror-remark/blob/master/src/syntax-extensions/StrikethroughExtension.ts) adds input rules and more `parseDOM` rules.

## Using it

Pass your extension next to a bundle:

```ts
const pmu = new ProseMirrorUnified([
  new MarkdownExtension(),
  new StrikethroughExtension(),
]);
```

Or, if it's needed in a particular place in the list of extensions (for example, a mark that should be serialized inside links), add it to a subclass of the bundle, as in [Picking individual extensions](/guide/choosing-extensions#subclassing-a-bundle).

## Sharing state between nodes

Some syntax needs information from elsewhere in the document. Reference-style links, for example, get their address from a definition that can come later. prosemirror-unified passes a `context` object to every conversion for this, and calls `postUnistToProseMirrorHook()` once the whole document is converted.

prosemirror-remark's extensions keep their part of the context under their class name, and export its type:

- `context.DefinitionExtension`: `DefinitionExtensionContext`, the definitions found so far, by identifier.
- `context.LinkReferenceExtension`: `LinkReferenceExtensionContext`, the link marks waiting for their definition.
- `context.ImageReferenceExtension`: `ImageReferenceExtensionContext`, the image nodes waiting for their definition.

An extension that works with definitions can read `context.DefinitionExtension` in its own `postUnistToProseMirrorHook()`. See [`LinkReferenceExtension`](https://github.com/marekdedic/prosemirror-remark/blob/master/src/syntax-extensions/LinkReferenceExtension.ts) for an example.
