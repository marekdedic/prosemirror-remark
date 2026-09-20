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
  .shouldConvertUnistNode({ type: "code", value: "Hello World!" }, (b) => [
    b.code_block("Hello World!"),
  ])
  .shouldConvertUnistNode(
    { lang: "ts", type: "code", value: "Hello World!" },
    (b) => [b.code_block({ lang: "ts" }, "Hello World!")],
  )
  .shouldConvertUnistNode(
    { lang: "ts", meta: "startline=2", type: "code", value: "Hello World!" },
    (b) => [b.code_block({ lang: "ts", meta: "startline=2" }, "Hello World!")],
  )
  .shouldMatchProseMirrorNode((b) => b.code_block())
  .shouldMatchProseMirrorNode((b) => b.code_block("Hello World!"))
  .shouldMatchProseMirrorNode((b) =>
    b.code_block({ lang: "ts" }, "Hello World!"),
  )
  .shouldMatchProseMirrorNode((b) =>
    b.code_block({ lang: "ts", meta: "startline=2" }, "Hello World!"),
  )
  .shouldConvertProseMirrorNode(
    (b) => b.code_block(),
    [{ type: "code", value: "" }],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.code_block("Hello World!"),
    [{ type: "code", value: "Hello World!" }],
  )
  .shouldMatchInputRule(
    "    Hello World!",
    (b) => [b.code_block("Hello World!")],
    "```\nHello World!\n```",
  )
  .shouldSupportKeymap(
    (b) => [b.p("Hello")],
    3,
    "{Mod-Shift-\\\\}",
    (b) => [b.code_block("Hello")],
    "```\nHello\n```",
  )
  .shouldSupportKeymap(
    (b) => [b.p("Hello"), b.p("World")],
    3,
    "{Mod-Shift-\\\\}",
    (b) => [b.code_block("Hello"), b.p("World")],
    "```\nHello\n```\n\nWorld",
  )
  .shouldSupportKeymap(
    (b) => [b.code_block("Hello")],
    4,
    "{Enter}",
    (b) => [b.code_block("Hel\nlo")],
    "```\nHel\nlo\n```",
  )
  .shouldSupportKeymap(
    (b) => [b.code_block("Hello")],
    6,
    "{Enter}",
    (b) => [b.code_block("Hello\n")],
    "```\nHello\n\n```",
  )
  .shouldSupportKeymap(
    (b) => [b.code_block("Hello\n")],
    6,
    "{Enter}",
    (b) => [b.code_block("Hello\n\n")],
    "```\nHello\n\n\n```",
  )
  .shouldSupportKeymap(
    (b) => [b.code_block("Hello\n\n")],
    8,
    "{Enter}",
    (b) => [b.code_block("Hello"), b.p()],
    "```\nHello\n```\n",
  )
  .shouldParseDOM("<pre><code>Hello</code></pre>", (b) => [
    b.code_block("Hello"),
  ])
  .shouldRenderDOM(
    (b) => [b.code_block("Hello")],
    "<pre><code>Hello</code></pre>",
  )
  .test();
