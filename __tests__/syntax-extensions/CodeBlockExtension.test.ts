import { CodeBlockExtension } from "../../src/syntax-extensions/CodeBlockExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new CodeBlockExtension(), {
  proseMirrorNodeName: "code_block",
  unistNodeName: "code",
})
  .shouldMatchUnistNode({ type: "code", value: "Hello World!" })
  .shouldMatchUnistNode({ type: "code", value: "Hello World!", lang: "ts" })
  .shouldMatchUnistNode({
    type: "code",
    value: "Hello World!",
    lang: "ts",
    meta: "startline=2",
  })
  .shouldNotMatchUnistNode({ type: "code_block" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "code", value: "Hello World!" }, (schema) => [
    schema.nodes.code_block.createAndFill({}, [schema.text("Hello World!")])!,
  ])
  .shouldConvertUnistNode(
    { type: "code", value: "Hello World!", lang: "ts" },
    (schema) => [
      schema.nodes.code_block.createAndFill({ lang: "ts" }, [
        schema.text("Hello World!"),
      ])!,
    ],
  )
  .shouldConvertUnistNode(
    { type: "code", value: "Hello World!", lang: "ts", meta: "startline=2" },
    (schema) => [
      schema.nodes.code_block.createAndFill(
        { lang: "ts", meta: "startline=2" },
        [schema.text("Hello World!")],
      )!,
    ],
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes.code_block.createAndFill()!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello World!")])!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.code_block.createAndFill({ lang: "ts" }, [
        schema.text("Hello World!"),
      ])!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.code_block.createAndFill(
        { lang: "ts", meta: "startline=2" },
        [schema.text("Hello World!")],
      )!,
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes.code_block.createAndFill()!,
    [{ type: "code", value: "" }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello World!")])!,
    [{ type: "code", value: "Hello World!" }],
  )
  /* TODO
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["code_block"].createAndFill({ lang: "ts" }, [
        schema.text("Hello World!"),
      ])!,
    [{ type: "code", value: "Hello World!", lang: "ts" }]
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["code_block"].createAndFill(
        { lang: "ts", meta: "startline=2" },
        [schema.text("Hello World!")]
      )!,
    [{ type: "code", value: "Hello World!", lang: "ts", meta: "startline=2" }]
  )
  .shouldMatchInputRule(
    "```\nHello World!\n```",
    (schema) => [
      schema.nodes["code_block"].createAndFill({}, [
        schema.text("\nHello World!\n"),
      ])!,
    ],
    "```\nHello World!\n```"
  )
  .shouldMatchInputRule(
    "```ts\nHello World!\n```",
    (schema) => [
      schema.nodes["code_block"].createAndFill({ lang: "ts" }, [
        schema.text("\nHello World!\n"),
      ])!,
    ],
    "```ts\nHello World!\n```"
  )
  .shouldMatchInputRule(
    "```ts startline=2\nHello World!\n```",
    (schema) => [
      schema.nodes["code_block"].createAndFill(
        { lang: "ts", meta: "startline=2" },
        [schema.text("\nHello World!\n")]
      )!,
    ],
    "```ts startline=2\nHello World!\n```"
  )
  */
  .shouldMatchInputRule(
    "    Hello World!",
    (schema) => [
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello World!")])!,
    ],
    "```\nHello World!\n```",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
    ],
    3,
    "Shift-Mod-\\",
    (schema) => [
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello")])!,
    ],
    "```\nHello\n```",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
      schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
    ],
    3,
    "Shift-Mod-\\",
    (schema) => [
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello")])!,
      schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
    ],
    "```\nHello\n```\n\nWorld",
  )
  /* TODO: Enable once jest-prosemirror supports keymaps with Enter
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello")])!,
    ],
    3,
    "Enter",
    (schema) => [
      schema.nodes.code_block.createAndFill({}, [schema.text("Hel\nlo")])!,
    ],
    "```\nHel\nlo\n```",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello")])!,
    ],
    5,
    "Enter",
    (schema) => [
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello\n")])!,
    ],
    "```\nHello\n\n```",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello\n")])!,
    ],
    5,
    "Enter",
    (schema) => [
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello\n\n")])!,
    ],
    "```\nHello\n\n\n```",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello\n\n")])!,
    ],
    5,
    "Enter",
    (schema) => [
      schema.nodes.code_block.createAndFill({}, [schema.text("Hello\n\n")])!,
      schema.nodes.paragraph.createAndFill({}, [])!,
    ],
    "```\nHello\n\n\n```\n",
  )
  */
  .test();
