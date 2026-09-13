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
  .shouldConvertUnistNode({ type: "thematicBreak" }, (b) => [b.hr()])
  .shouldMatchProseMirrorNode((b) => b.hr())
  .shouldConvertProseMirrorNode((b) => b.hr(), [{ type: "thematicBreak" }])
  .shouldSupportKeymap(
    () => [],
    "start",
    "{Mod-_}",
    (b) => [b.hr()],
    "---",
  )
  .shouldSupportKeymap(
    (b) => [b.p("abcdef")],
    4,
    "{Mod-_}",
    (b) => [b.p("abc"), b.hr(), b.p("def")],
    "abc\n\n---\n\ndef",
  )
  .shouldSupportKeymap(
    (b) => [b.p("abcdef")],
    { anchor: 3, head: 5 },
    "{Mod-_}",
    (b) => [b.p("ab"), b.hr(), b.p("ef")],
    "ab\n\n---\n\nef",
  )
  .shouldMatchInputRule(
    "***{Enter}",
    (b) => [b.p(), b.hr(), b.p()],
    "\n\n---\n",
  )
  .shouldMatchInputRule(
    "---{Enter}",
    (b) => [b.p(), b.hr(), b.p()],
    "\n\n---\n",
  )
  .shouldMatchInputRule(
    "___{Enter}",
    (b) => [b.p(), b.hr(), b.p()],
    "\n\n---\n",
  )
  .shouldMatchInputRule(
    " ***{Enter}",
    (b) => [b.p(), b.hr(), b.p()],
    "\n\n---\n",
  )
  .shouldMatchInputRule(
    "  ***{Enter}",
    (b) => [b.p(), b.hr(), b.p()],
    "\n\n---\n",
  )
  .shouldMatchInputRule(
    "   ***{Enter}",
    (b) => [b.p(), b.hr(), b.p()],
    "\n\n---\n",
  )
  .shouldNotMatchInputRule("*-*{Enter}", "*-*\n", (b) => [
    b.p(b.em("-")),
    b.p(),
  ])
  .shouldNotMatchInputRule("*_*{Enter}", "*\\_*\n", (b) => [
    b.p(b.em("_")),
    b.p(),
  ])
  .shouldNotMatchInputRule("* **{Enter}", "\\* \\*\\*\n", (b) => [
    b.p("* **"),
    b.p(),
  ])
  .shouldNotMatchInputRule("** *{Enter}", "\\*\\* \\*\n", (b) => [
    b.p("** *"),
    b.p(),
  ])
  .shouldNotMatchInputRule("a***{Enter}", "a\\*\\*\\*\n", (b) => [
    b.p("a***"),
    b.p(),
  ])
  .shouldNotMatchInputRule(
    "***bold italic***",
    "**\\*bold italic**\\*",
    (b) => [b.p(b.strong("*bold italic"), "*")],
  )
  .shouldParseDOM("<hr>", (b) => [b.hr()])
  .shouldRenderDOM((b) => [b.hr()], "<div><hr></div>")
  .test();
