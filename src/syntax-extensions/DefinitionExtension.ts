import type { Definition } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import { NodeExtension } from "prosemirror-unified";

/**
 * @public
 */
export interface DefinitionExtensionContext {
  definitions: Record<
    string,
    { url: string; title: string | null | undefined }
  >;
}

/**
 * @public
 */
export class DefinitionExtension extends NodeExtension<Definition> {
  public override unistNodeName(): "definition" {
    return "definition";
  }

  public override proseMirrorNodeName(): null {
    return null;
  }

  public override proseMirrorNodeSpec(): null {
    return null;
  }

  public override unistNodeToProseMirrorNodes(
    node: Definition,
    _proseMirrorSchema: Schema<string, string>,
    _convertedChildren: Array<ProseMirrorNode>,
    context: Partial<{
      DefinitionExtension: DefinitionExtensionContext;
    }>,
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

  public override proseMirrorNodeToUnistNodes(): Array<Definition> {
    return [];
  }
}
