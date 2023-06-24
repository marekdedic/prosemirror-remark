import type { Code, Text } from "mdast";
import { setBlockType } from "prosemirror-commands";
import { type InputRule, textblockTypeInputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";
import {
  createProseMirrorNode,
  type Extension,
  NodeExtension,
} from "prosemirror-unified";

import { TextExtension } from "./TextExtension";

/**
 * @public
 */
export class CodeBlockExtension extends NodeExtension<Code> {
  public dependencies(): Array<Extension> {
    return [new TextExtension()];
  }

  public unistNodeName(): "code" {
    return "code";
  }

  public proseMirrorNodeName(): string {
    return "code_block";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "text*",
      group: "block",
      code: true,
      defining: true,
      marks: "",
      parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
      toDOM(): DOMOutputSpec {
        return ["pre", ["code", 0]];
      },
    };
  }

  public proseMirrorInputRules(): Array<InputRule> {
    return [
      textblockTypeInputRule(
        /^\s{0,3}```$/,
        this.proseMirrorSchema().nodes[this.proseMirrorNodeName()]
      ),
      textblockTypeInputRule(
        /^\s{4}$/,
        this.proseMirrorSchema().nodes[this.proseMirrorNodeName()]
      ),
    ];
  }

  public proseMirrorKeymap(): Record<string, Command> {
    return {
      "Shift-Mod-\\": setBlockType(
        this.proseMirrorSchema().nodes[this.proseMirrorNodeName()]
      ),
    };
  }

  public unistNodeToProseMirrorNodes(node: Code): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      this.proseMirrorSchema(),
      [this.proseMirrorSchema().text(node.value)]
    );
  }

  public proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<Text>
  ): Array<Code> {
    return [
      {
        type: this.unistNodeName(),
        value: convertedChildren.map((child) => child.value).join(""),
      },
    ];
  }
}
