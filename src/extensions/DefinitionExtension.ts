import type { Definition } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";

import type { ConverterContext } from "../ConverterContext";
import { NodeExtension } from "../NodeExtension";

export class DefinitionExtension extends NodeExtension {
  public mdastNodeName(): "definition" {
    return "definition";
  }

  public proseMirrorNodeName(): null {
    return null; // TODO
  }

  public proseMirrorNodeSpec(): null {
    return null;
  }

  public mdastNodeToProseMirrorNodes(
    node: Definition,
    _1: Array<ProseMirrorNode>,
    _2: Schema,
    context: ConverterContext
  ): Array<ProseMirrorNode> {
    if (context.DefinitionExtension === undefined) {
      context.DefinitionExtension = {};
    }
    if (context.DefinitionExtension.imageDefinitions === undefined) {
      context.DefinitionExtension.imageDefinitions = {};
    }
    context.DefinitionExtension.imageDefinitions[node.identifier] = {
      title: node.title,
      url: node.url,
    };
    return [];
  }

  public proseMirrorNodeToMdastNodes(): Array<Definition> {
    return [];
  }
}
