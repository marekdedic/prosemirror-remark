import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new ItalicExtension(), {
  otherExtensionsInTest: [new BoldExtension()],
  proseMirrorMarkName: "em",
  unistNodeName: "emphasis",
})
  .shouldMatchUnistNode({ children: [], type: "emphasis" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Hello World!" }],
      type: "emphasis",
    },
    (b) => [b.em("Hello World!")],
  )
  .shouldMatchProseMirrorMark((b) => b.schema.mark("em"))
  .shouldConvertProseMirrorNode(
    (b) =>
      b.schema
        .text("Hello World!")
        .mark([b.schema.mark("em"), b.schema.mark("strong")]),
    [
      {
        children: [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "emphasis",
          },
        ],
        type: "strong",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.em("Hello World!"),
    [{ children: [{ type: "text", value: "Hello World!" }], type: "emphasis" }],
  )
  .shouldSupportKeymap(
    (b) => [b.p()],
    "start",
    "{Mod-i}",
    (b) => [b.p()],
    "",
  )
  .shouldSupportKeymap(
    (b) => [b.p("abcdef")],
    { anchor: 3, head: 5 },
    "{Mod-i}",
    (b) => [b.p("ab", b.em("cd"), "ef")],
    "ab*cd*ef",
  )
  .shouldSupportKeymap(
    (b) => [b.p()],
    "start",
    "{Mod-I}",
    (b) => [b.p()],
    "",
  )
  .shouldSupportKeymap(
    (b) => [b.p("abcdef")],
    { anchor: 3, head: 5 },
    "{Mod-I}",
    (b) => [b.p("ab", b.em("cd"), "ef")],
    "ab*cd*ef",
  )
  .shouldMatchInputRule("*Test*", "*Test*", "Test")
  .shouldMatchInputRule("_Test_", "*Test*", "Test")
  .shouldMatchInputRule("*Hello World*", "*Hello World*", "Hello World")
  .shouldMatchInputRule("*Test*{Enter}", "*Test*\n\n", (b) => [
    b.p(b.em("Test")),
    b.p(),
  ])
  .shouldMatchInputRule("_Test_{Enter}", "*Test*\n\n", (b) => [
    b.p(b.em("Test")),
    b.p(),
  ])
  .shouldNotMatchInputRule("*Test_", "\\*Test\\_")
  .shouldParseDOM("<p><i>Hello</i></p>", (b) => [b.p(b.em("Hello"))])
  .shouldParseDOM("<p><em>Hello</em></p>", (b) => [b.p(b.em("Hello"))])
  .shouldParseDOM(
    '<p><span style="font-style: italic">Hello</span></p>',
    (b) => [b.p(b.em("Hello"))],
  )
  .shouldParseDOM(
    '<p><span style="font-style: oblique">Hello</span></p>',
    (b) => [b.p("Hello")],
  )
  .shouldParseDOM(
    '<p><span style="font-style: normal">Hello</span></p>',
    (b) => [b.p("Hello")],
  )
  .shouldRenderDOM((b) => [b.p(b.em("Hello"))], "<p><em>Hello</em></p>")
  .test();
