import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new HorizontalRuleExtension(), {
  otherExtensionsInTest: [new BoldExtension(), new ItalicExtension()],
  proseMirrorNodeName: "horizontal_rule",
  unistNodeName: "thematicBreak",
})
  .shouldMatchUnistNode({ type: "thematicBreak" })
  .shouldNotMatchUnistNode({ type: "horizontal_rule" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "thematicBreak" }, (schema) => [
    schema.nodes["horizontal_rule"].createAndFill()!,
  ])
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes["horizontal_rule"].createAndFill()!,
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["horizontal_rule"].createAndFill()!,
    [{ type: "thematicBreak" }],
  )
  .shouldSupportKeymap(
    () => [],
    "start",
    "Mod-_",
    (schema) => [schema.nodes["horizontal_rule"].createAndFill()!],
    "---",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["paragraph"].createAndFill({}, [schema.text("abcdef")])!,
    ],
    4,
    "Mod-_",
    (schema) => [
      schema.nodes["paragraph"].createAndFill({}, [schema.text("abc")])!,
      schema.nodes["horizontal_rule"].createAndFill()!,
      schema.nodes["paragraph"].createAndFill({}, [schema.text("def")])!,
    ],
    "abc\n\n---\n\ndef",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["paragraph"].createAndFill({}, [schema.text("abcdef")])!,
    ],
    { from: 3, to: 5 },
    "Mod-_",
    (schema) => [
      schema.nodes["paragraph"].createAndFill({}, [schema.text("ab")])!,
      schema.nodes["horizontal_rule"].createAndFill()!,
      schema.nodes["paragraph"].createAndFill({}, [schema.text("ef")])!,
    ],
    "ab\n\n---\n\nef",
  )
  .shouldMatchInputRule(
    "***\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldMatchInputRule(
    "---\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldMatchInputRule(
    "___\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldMatchInputRule(
    " ***\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldMatchInputRule(
    "  ***\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldMatchInputRule(
    "   ***\n",
    (schema) => [
      schema.nodes["paragraph"].createAndFill()!,
      schema.nodes["horizontal_rule"].createAndFill()!,
    ],
    "---",
  )
  .shouldNotMatchInputRule("*-*\n", "*-*", (schema) => [
    schema.nodes["paragraph"].createAndFill({}, [
      schema.text("-").mark([schema.marks["em"].create()]),
      schema.text("\n"),
    ])!,
  ])
  .shouldNotMatchInputRule("*_*\n", "*\\_*", (schema) => [
    schema.nodes["paragraph"].createAndFill({}, [
      schema.text("_").mark([schema.marks["em"].create()]),
      schema.text("\n"),
    ])!,
  ])
  .shouldNotMatchInputRule("* **\n", "\\* \\*\\*")
  .shouldNotMatchInputRule("** *\n", "\\*\\* \\*")
  .shouldNotMatchInputRule("a***\n", "a\\*\\*\\*")
  .shouldNotMatchInputRule(
    "***bold italic***",
    "**\\*bold italic**\\*",
    (schema) => [
      schema.nodes["paragraph"].createAndFill({}, [
        schema.text("*bold italic").mark([schema.marks["strong"].create()]),
        schema.text("*"),
      ])!,
    ],
  )
  .test();
