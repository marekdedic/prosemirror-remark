import { Extension } from "prosemirror-unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

export class ParserProviderExtension extends Extension {
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
