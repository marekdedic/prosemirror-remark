import type { Node as UnistNode } from "unist";

import type { Extension } from "./Extension";
import { MarkExtension } from "./MarkExtension";
import { NodeExtension } from "./NodeExtension";
import { SyntaxExtension } from "./SyntaxExtension";

function isSyntaxExtension(
  extension: Extension
): extension is SyntaxExtension<UnistNode> {
  return extension instanceof SyntaxExtension;
}

function isNodeExtension<UNode extends UnistNode>(
  extension: SyntaxExtension<UNode>
): extension is NodeExtension<UNode> {
  return extension instanceof NodeExtension;
}

function isMarkExtension<UNode extends UnistNode>(
  extension: SyntaxExtension<UNode>
): extension is MarkExtension<UNode> {
  return extension instanceof MarkExtension;
}

export class ExtensionManager {
  private readonly extensionList: Array<Extension>;

  public constructor(extensions: Array<Extension>) {
    this.extensionList = extensions;
  }

  public extensions(): Array<Extension> {
    return this.extensionList;
  }

  public markExtensions(): Array<MarkExtension<UnistNode>> {
    return this.syntaxExtensions().filter(isMarkExtension);
  }

  public nodeExtensions(): Array<NodeExtension<UnistNode>> {
    return this.syntaxExtensions().filter(isNodeExtension);
  }

  public syntaxExtensions(): Array<SyntaxExtension<UnistNode>> {
    return this.extensions().filter(isSyntaxExtension);
  }
}
