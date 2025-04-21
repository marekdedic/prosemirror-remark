import { CodeBlockExtension } from "../../src/syntax-extensions/CodeBlockExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new CodeBlockExtension(), {
  proseMirrorNodeName: "code_block",
  unistNodeName: "code",
})
  .shouldMatchUnistNode({ type: "code", value: "Hello World!" })
  .shouldMatchUnistNode({ lang: "ts", type: "code", value: "Hello World!" })
  .shouldMatchUnistNode({
    lang: "ts",
    meta: "startline=2",
    type: "code",
    value: "Hello World!",
  })
  .shouldNotMatchUnistNode({ type: "code_block" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "code", value: "Hello World!" }, (schema) => [
    schema.nodes["code_block"].create({}, [schema.text("Hello World!")]),
  ])
  .shouldConvertUnistNode(
    { lang: "ts", type: "code", value: "Hello World!" },
    (schema) => [
      schema.nodes["code_block"].create({ lang: "ts" }, [
        schema.text("Hello World!"),
      ]),
    ],
  )
  .shouldConvertUnistNode(
    { lang: "ts", meta: "startline=2", type: "code", value: "Hello World!" },
    (schema) => [
      schema.nodes["code_block"].create({ lang: "ts", meta: "startline=2" }, [
        schema.text("Hello World!"),
      ]),
    ],
  )
  .shouldMatchProseMirrorNode((schema) => schema.nodes["code_block"].create())
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["code_block"].create({}, [schema.text("Hello World!")]),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["code_block"].create({ lang: "ts" }, [
      schema.text("Hello World!"),
    ]),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["code_block"].create({ lang: "ts", meta: "startline=2" }, [
      schema.text("Hello World!"),
    ]),
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["code_block"].create(),
    [{ type: "code", value: "" }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["code_block"].create({}, [schema.text("Hello World!")]),
    [{ type: "code", value: "Hello World!" }],
  )
  .shouldMatchInputRule(
    "    Hello World!",
    (schema) => [
      schema.nodes["code_block"].create({}, [schema.text("Hello World!")]),
    ],
    "```\nHello World!\n```",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("Hello")])],
    3,
    "\\",
    { ctrlKey: true, shiftKey: true },
    (schema) => [schema.nodes["code_block"].create({}, [schema.text("Hello")])],
    "```\nHello\n```",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
      schema.nodes["paragraph"].create({}, [schema.text("World")]),
    ],
    3,
    "\\",
    { ctrlKey: true, shiftKey: true },
    (schema) => [
      schema.nodes["code_block"].create({}, [schema.text("Hello")]),
      schema.nodes["paragraph"].create({}, [schema.text("World")]),
    ],
    "```\nHello\n```\n\nWorld",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["code_block"].create({}, [schema.text("Hello")])],
    4,
    "{Enter}",
    {},
    (schema) => [
      schema.nodes["code_block"].create({}, [schema.text("Hel\nlo")]),
    ],
    "```\nHel\nlo\n```",
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["code_block"].create({}, [schema.text("Hello")])],
    6,
    "{Enter}",
    {},
    (schema) => [
      schema.nodes["code_block"].create({}, [schema.text("Hello\n")]),
    ],
    "```\nHello\n\n```",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["code_block"].create({}, [schema.text("Hello\n")]),
    ],
    6,
    "{Enter}",
    {},
    (schema) => [
      schema.nodes["code_block"].create({}, [schema.text("Hello\n\n")]),
    ],
    "```\nHello\n\n\n```",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["code_block"].create({}, [schema.text("Hello\n\n")]),
    ],
    8,
    "{Enter}",
    {},
    (schema) => [
      schema.nodes["code_block"].create({}, [schema.text("Hello")]),
      schema.nodes["paragraph"].create({}, []),
    ],
    "```\nHello\n```\n",
  )
  .test();
