import { Extension } from "prosemirror-unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { BlockquoteExtension } from "./syntax-extensions/BlockquoteExtension";
import { BoldExtension } from "./syntax-extensions/BoldExtension";
import { BreakExtension } from "./syntax-extensions/BreakExtension";
import { CodeBlockExtension } from "./syntax-extensions/CodeBlockExtension";
import { DefinitionExtension } from "./syntax-extensions/DefinitionExtension";
import { HeadingExtension } from "./syntax-extensions/HeadingExtension";
import { HorizontalRuleExtension } from "./syntax-extensions/HorizontalRuleExtension";
import { ImageExtension } from "./syntax-extensions/ImageExtension";
import { ImageReferenceExtension } from "./syntax-extensions/ImageReferenceExtension";
import { InlineCodeExtension } from "./syntax-extensions/InlineCodeExtension";
import { ItalicExtension } from "./syntax-extensions/ItalicExtension";
import { LinkExtension } from "./syntax-extensions/LinkExtension";
import { LinkReferenceExtension } from "./syntax-extensions/LinkReferenceExtension";
import { ListItemExtension } from "./syntax-extensions/ListItemExtension";
import { OrderedListExtension } from "./syntax-extensions/OrderedListExtension";
import { ParagraphExtension } from "./syntax-extensions/ParagraphExtension";
import { RootExtension } from "./syntax-extensions/RootExtension";
import { TextExtension } from "./syntax-extensions/TextExtension";
import { UnorderedListExtension } from "./syntax-extensions/UnorderedListExtension";

/**
 * @public
 */
export class MarkdownExtension extends Extension {
  public override dependencies(): Array<Extension> {
    return [
      // ParagraphExtension needs to be first so that it is the default block.
      new ParagraphExtension(),
      new BlockquoteExtension(),
      new BoldExtension(),
      new BreakExtension(),
      new CodeBlockExtension(),
      new DefinitionExtension(),
      new HeadingExtension(),
      new HorizontalRuleExtension(),
      new ImageExtension(),
      new ImageReferenceExtension(),
      new InlineCodeExtension(),
      new ItalicExtension(),
      new LinkExtension(),
      new LinkReferenceExtension(),
      new ListItemExtension(),
      new OrderedListExtension(),
      new RootExtension(),
      new TextExtension(),
      new UnorderedListExtension(),
    ];
  }

  public override unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
    return processor.use(remarkParse).use(remarkStringify, {
      fences: true,
      listItemIndent: "one",
      resourceLink: true,
      rule: "-",
    }) as unknown as Processor<
      UnistNode,
      UnistNode,
      UnistNode,
      UnistNode,
      string
    >;
  }
}
