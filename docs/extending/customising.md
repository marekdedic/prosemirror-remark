# Customising an extension

Extensions are classes, so you change how one behaves by subclassing it and overriding the methods you want to change. The methods are described in prosemirror-unified's [Extension API](https://marekdedic.github.io/prosemirror-unified/developing/extensions).

## Overriding a method

For example, to make `Mod-Shift-x` toggle bold instead of `Mod-b`:

```ts
import type { Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";

import { toggleMark } from "prosemirror-commands";
import { BoldExtension } from "prosemirror-remark";

class MyBoldExtension extends BoldExtension {
  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return {
      "Mod-Shift-x": toggleMark(
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
    };
  }
}
```

Or, to render horizontal rules as a plain `<hr>`, without the wrapping `<div>`:

```ts
import type { DOMOutputSpec, NodeSpec } from "prosemirror-model";

import { HorizontalRuleExtension } from "prosemirror-remark";

class MyHorizontalRuleExtension extends HorizontalRuleExtension {
  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      ...super.proseMirrorNodeSpec(),
      toDOM: (): DOMOutputSpec => ["hr"],
    };
  }
}
```

When changing `toDOM`, make sure `parseDOM` still recognises what it renders. The editor uses both when copying and pasting.

Don't change the names of nodes and marks (`proseMirrorNodeName()` and `proseMirrorMarkName()`). Some extensions refer to each other by these names: for example, `TaskListItemExtension` turns `regular_list_item` nodes into task items.

## Using the customised extension

Your subclass replaces the original, so it has to be used instead of it, not next to it. Passing both `MarkdownExtension` and `MyBoldExtension` to `ProseMirrorUnified` throws an error, because both `BoldExtension` and `MyBoldExtension` provide the `strong` mark.

Instead, subclass the bundle as well, and swap your extension in:

```ts
import { BoldExtension, MarkdownExtension } from "prosemirror-remark";
import type { Extension } from "prosemirror-unified";
import { ProseMirrorUnified } from "prosemirror-unified";

class MyMarkdownExtension extends MarkdownExtension {
  public override dependencies(): Array<Extension> {
    return super
      .dependencies()
      .map((extension) =>
        extension instanceof BoldExtension ? new MyBoldExtension() : extension,
      );
  }
}

const pmu = new ProseMirrorUnified([new MyMarkdownExtension()]);
```

Mapping keeps the extension in the same place in the list, which [matters](/guide/choosing-extensions#order) for some of them.

For `GFMExtension`, which includes `MarkdownExtension`, swap `MarkdownExtension` for your subclass in the same way:

```ts
class MyGFMExtension extends GFMExtension {
  public override dependencies(): Array<Extension> {
    return super
      .dependencies()
      .map((extension) =>
        extension instanceof MarkdownExtension
          ? new MyMarkdownExtension()
          : extension,
      );
  }
}
```

## Changing the Markdown output

The formatting of the Markdown that `serialize` writes is set by the [remark-stringify options](/reference/bundles#markdownextension) in `MarkdownExtension`. To change them, override its `unifiedInitializationHook()` and register `remark-stringify` again with the options you want to change. They're merged with the existing ones:

```ts
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { MarkdownExtension } from "prosemirror-remark";
import remarkStringify from "remark-stringify";

class MyMarkdownExtension extends MarkdownExtension {
  public override unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
    return super
      .unifiedInitializationHook(processor)
      .use(remarkStringify, { bullet: "-", emphasis: "_" }) as unknown as Processor<
      UnistNode,
      UnistNode,
      UnistNode,
      UnistNode,
      string
    >;
  }
}
```

This writes bullet lists with `-` and italic text with `_`. See the [remark-stringify documentation](https://github.com/remarkjs/remark/tree/main/packages/remark-stringify#options) for all the options.

The options are only merged if `remark-stringify` is the same copy that prosemirror-remark uses. Install the same major version (`npm ls remark-stringify` shows which copies you have). With a different copy, your options replace the existing ones instead of being merged with them.
