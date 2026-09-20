import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new BoldExtension(), {
  otherExtensionsInTest: [new ItalicExtension()],
  proseMirrorMarkName: "strong",
  unistNodeName: "strong",
})
  .shouldMatchUnistNode({ children: [], type: "strong" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Hello World!" }],
      type: "strong",
    },
    (b) => [b.strong("Hello World!")],
  )
  .shouldMatchProseMirrorMark((b) => b.schema.mark("strong"))
  .shouldConvertProseMirrorNode(
    (b) => b.strong("Hello World!"),
    [{ children: [{ type: "text", value: "Hello World!" }], type: "strong" }],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.strong(b.em("Hello World!")),
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
  .shouldSupportKeymap(
    (b) => [b.p()],
    "start",
    "{Mod-b}",
    (b) => [b.p()],
    "",
  )
  .shouldSupportKeymap(
    (b) => [b.p("abcdef")],
    { anchor: 3, head: 5 },
    "{Mod-b}",
    (b) => [b.p("ab", b.strong("cd"), "ef")],
    "ab**cd**ef",
  )
  .shouldSupportKeymap(
    (b) => [b.p()],
    "start",
    "{Mod-B}",
    (b) => [b.p()],
    "",
  )
  .shouldSupportKeymap(
    (b) => [b.p("abcdef")],
    { anchor: 3, head: 5 },
    "{Mod-B}",
    (b) => [b.p("ab", b.strong("cd"), "ef")],
    "ab**cd**ef",
  )
  .shouldMatchInputRule("**Test**", "**Test**", "Test")
  .shouldMatchInputRule("__Test__", "**Test**", "Test")
  .shouldMatchInputRule("**Hello World**", "**Hello World**", "Hello World")
  .shouldMatchInputRule("**Test**{Enter}", "**Test**\n\n", (b) => [
    b.p(b.strong("Test")),
    b.p(),
  ])
  .shouldMatchInputRule("__Test__{Enter}", "**Test**\n\n", (b) => [
    b.p(b.strong("Test")),
    b.p(),
  ])
  .shouldNotMatchInputRule("X*_Test**X", "&#x58;*\\_Test\\**&#x58;", (b) => [
    b.p("X", b.em("_Test*"), "X"),
  ])
  .shouldNotMatchInputRule("X_*Test**X", "X\\_*Test\\**&#x58;", (b) => [
    b.p("X_", b.em("Test*"), "X"),
  ])
  .shouldNotMatchInputRule("**Test__", "\\*\\*Test\\_\\_")
  .shouldNotMatchInputRule("**Test_*", "\\*\\*Test\\_\\*")
  .shouldNotMatchInputRule("**Test*_", "\\*\\*Test\\*\\_")
  .shouldNotMatchInputRule("X* *Test**X", "X\\* *Test\\**&#x58;", (b) => [
    b.p("X* ", b.em("Test*"), "X"),
  ])
  .shouldNotMatchInputRule("**Test* *", "\\*\\*Test\\* \\*")
  .shouldParseDOM("<p><b>Hello</b></p>", (b) => [b.p(b.strong("Hello"))])
  .shouldParseDOM("<p><strong>Hello</strong></p>", (b) => [
    b.p(b.strong("Hello")),
  ])
  .shouldParseDOM(
    '<p><span style="font-weight: bold">Hello</span></p>',
    (b) => [b.p(b.strong("Hello"))],
  )
  .shouldParseDOM(
    '<p><span style="font-weight: bolder">Hello</span></p>',
    (b) => [b.p(b.strong("Hello"))],
  )
  .shouldParseDOM('<p><span style="font-weight: 700">Hello</span></p>', (b) => [
    b.p(b.strong("Hello")),
  ])
  .shouldParseDOM(
    '<p><span style="font-weight: normal">Hello</span></p>',
    (b) => [b.p("Hello")],
  )
  .shouldParseDOM('<p><span style="font-weight: 400">Hello</span></p>', (b) => [
    b.p("Hello"),
  ])
  .shouldRenderDOM(
    (b) => [b.p(b.strong("Hello"))],
    "<p><strong>Hello</strong></p>",
  )
  .test();
