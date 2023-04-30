import type { Definition } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";

import {
  type ConverterContext,
  NodeExtension,
} from "../../prosemirror-unified";

export interface DefinitionExtensionContext {
  definitions: Record<
    string,
    { url: string; title: string | null | undefined }
  >;
}

export class DefinitionExtension extends NodeExtension<Definition> {
  public unistNodeName(): "definition" {
    return "definition";
  }

  public proseMirrorNodeName(): null {
    return null; // TODO
  }

  public proseMirrorNodeSpec(): null {
    return null;
  }

  public unistNodeToProseMirrorNodes(
    node: Definition,
    _schema: Schema<string, string>,
    _convertedChildren: Array<ProseMirrorNode>,
    context: ConverterContext<{
      DefinitionExtension: DefinitionExtensionContext;
    }>
  ): Array<ProseMirrorNode> {
    if (context.DefinitionExtension === undefined) {
      context.DefinitionExtension = { definitions: {} };
    }
    context.DefinitionExtension.definitions[node.identifier] = {
      title: node.title,
      url: node.url,
    };
    return [];
  }

  public proseMirrorNodeToUnistNodes(): Array<Definition> {
    return [];
  }
}
