import { Extension } from "../prosemirror-unified";
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

export class MarkdownExtension extends Extension {
  public dependencies(): Array<Extension> {
    // TODO: Check all extensions for whether they should declare any dependencies
    return [
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
      new ParagraphExtension(),
      new RootExtension(),
      new TextExtension(),
      new UnorderedListExtension(),
    ];
  }
}
