import { InlineCodeExtension } from "../../src/syntax-extensions/InlineCodeExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new InlineCodeExtension(), {
  proseMirrorMarkName: "code",
  unistNodeName: "inlineCode",
})
  .shouldMatchUnistNode({ type: "inlineCode", value: "" })
  .shouldMatchUnistNode({ type: "inlineCode", value: "Test" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "inlineCode",
      value: "Hello World!",
    },
    (b) => [b.code("Hello World!")],
  )
  .shouldMatchProseMirrorMark((b) => b.schema.mark("code"))
  .shouldConvertProseMirrorNode(
    (b) => b.code("Hello World!"),
    [{ type: "inlineCode", value: "Hello World!" }],
  )
  .shouldSupportKeymap(
    (b) => [b.p()],
    "start",
    "{Mod-`}",
    (b) => [b.p()],
    "",
  )
  .shouldSupportKeymap(
    (b) => [b.p("abcdef")],
    { anchor: 3, head: 5 },
    "{Mod-`}",
    (b) => [b.p("ab", b.code("cd"), "ef")],
    "ab`cd`ef",
  )
  .shouldMatchInputRule("`Test`", "`Test`", "Test")
  .shouldMatchInputRule("`Hello World`", "`Hello World`", "Hello World")
  .shouldMatchInputRule("`Test`{Enter}", "`Test`\n\n", (b) => [
    b.p(b.code("Test")),
    b.p(),
  ])
  .shouldParseDOM("<p><code>Hello</code></p>", (b) => [b.p(b.code("Hello"))])
  .shouldRenderDOM((b) => [b.p(b.code("Hello"))], "<p><code>Hello</code></p>")
  .test();
