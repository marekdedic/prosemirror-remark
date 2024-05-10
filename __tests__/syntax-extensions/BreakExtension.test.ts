import { BreakExtension } from "../../src/syntax-extensions/BreakExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new BreakExtension(), {
  proseMirrorNodeName: "hard_break",
  unistNodeName: "break",
})
  .shouldMatchUnistNode({ type: "break" })
  .shouldNotMatchUnistNode({ type: "hard_break" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "break" }, (schema) => [
    schema.nodes.hard_break.createAndFill()!,
  ])
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes.hard_break.createAndFill()!,
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes.hard_break.createAndFill()!,
    [{ type: "break" }],
  )
  /* TODO: Re-enable once jest-prosemirror supports keymaps with Enter
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
    ],
    3,
    "Mod-Enter",
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [
        schema.text("He"),
        schema.nodes.hard_break.createAndFill()!,
        schema.text("llo"),
      ])!,
    ],
    "He\\\nllo",
  )
  */
  .test();
