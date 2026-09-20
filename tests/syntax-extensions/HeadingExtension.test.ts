import { HeadingExtension } from "../../src/syntax-extensions/HeadingExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new HeadingExtension(), {
  proseMirrorNodeName: "heading",
  unistNodeName: "heading",
})
  .shouldMatchUnistNode({ children: [], depth: 1, type: "heading" })
  .shouldMatchUnistNode({ children: [], depth: 3, type: "heading" })
  .shouldMatchUnistNode({ children: [], depth: 6, type: "heading" })
  .shouldMatchUnistNode({
    children: [{ type: "text", value: "Hello World!" }],
    depth: 3,
    type: "heading",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Hello World!" }],
      depth: 1,
      type: "heading",
    },
    (b) => [b.heading({ level: 1 }, "Hello World!")],
  )
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Hello World!" }],
      depth: 3,
      type: "heading",
    },
    (b) => [b.heading({ level: 3 }, "Hello World!")],
  )
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Hello World!" }],
      depth: 6,
      type: "heading",
    },
    (b) => [b.heading({ level: 6 }, "Hello World!")],
  )
  .shouldMatchProseMirrorNode((b) => b.heading({ level: 1 }))
  .shouldMatchProseMirrorNode((b) => b.heading({ level: 3 }))
  .shouldMatchProseMirrorNode((b) => b.heading({ level: 6 }))
  .shouldMatchProseMirrorNode((b) => b.heading({ level: 3 }, "Hello World!"))
  .shouldConvertProseMirrorNode(
    (b) => b.heading({ level: 4 }),
    [{ children: [], depth: 4, type: "heading" }],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.heading({ level: 1 }, "Hello World!"),
    [
      {
        children: [{ type: "text", value: "Hello World!" }],
        depth: 1,
        type: "heading",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.heading({ level: 3 }, "Hello World!"),
    [
      {
        children: [{ type: "text", value: "Hello World!" }],
        depth: 3,
        type: "heading",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.heading({ level: 6 }, "Hello World!"),
    [
      {
        children: [{ type: "text", value: "Hello World!" }],
        depth: 6,
        type: "heading",
      },
    ],
  )
  .shouldSupportKeymap(
    (b) => [b.heading({ level: 1 }, "Hello")],
    "start",
    "#",
    (b) => [b.heading({ level: 2 }, "Hello")],
    "## Hello",
  )
  .shouldSupportKeymap(
    (b) => [b.heading({ level: 2 }, "Hello")],
    "start",
    "#",
    (b) => [b.heading({ level: 3 }, "Hello")],
    "### Hello",
  )
  .shouldSupportKeymap(
    (b) => [b.heading({ level: 3 }, "Hello")],
    "start",
    "#",
    (b) => [b.heading({ level: 4 }, "Hello")],
    "#### Hello",
  )
  .shouldSupportKeymap(
    (b) => [b.heading({ level: 4 }, "Hello")],
    "start",
    "#",
    (b) => [b.heading({ level: 5 }, "Hello")],
    "##### Hello",
  )
  .shouldSupportKeymap(
    (b) => [b.heading({ level: 5 }, "Hello")],
    "start",
    "#",
    (b) => [b.heading({ level: 6 }, "Hello")],
    "###### Hello",
  )
  .shouldSupportKeymap(
    (b) => [b.heading({ level: 6 }, "Hello")],
    "start",
    "#",
    (b) => [b.heading({ level: 6 }, "#Hello")],
    "###### #Hello",
  )
  .shouldMatchInputRule(
    "# Hello World!",
    (b) => [b.heading({ level: 1 }, "Hello World!")],
    "# Hello World!",
  )
  .shouldMatchInputRule(
    "## Hello World!",
    (b) => [b.heading({ level: 2 }, "Hello World!")],
    "## Hello World!",
  )
  .shouldMatchInputRule(
    "### Hello World!",
    (b) => [b.heading({ level: 3 }, "Hello World!")],
    "### Hello World!",
  )
  .shouldMatchInputRule(
    "#### Hello World!",
    (b) => [b.heading({ level: 4 }, "Hello World!")],
    "#### Hello World!",
  )
  .shouldMatchInputRule(
    "##### Hello World!",
    (b) => [b.heading({ level: 5 }, "Hello World!")],
    "##### Hello World!",
  )
  .shouldMatchInputRule(
    "###### Hello World!",
    (b) => [b.heading({ level: 6 }, "Hello World!")],
    "###### Hello World!",
  )
  .shouldMatchInputRule(
    " # Hello World!",
    (b) => [b.heading({ level: 1 }, "Hello World!")],
    "# Hello World!",
  )
  .shouldMatchInputRule(
    "  # Hello World!",
    (b) => [b.heading({ level: 1 }, "Hello World!")],
    "# Hello World!",
  )
  .shouldMatchInputRule(
    "   # Hello World!",
    (b) => [b.heading({ level: 1 }, "Hello World!")],
    "# Hello World!",
  )
  .shouldNotMatchInputRule("####### Hello World!", "\\####### Hello World!")
  .shouldParseDOM("<h1>Hello</h1>", (b) => [b.heading({ level: 1 }, "Hello")])
  .shouldParseDOM("<h3>Hello</h3>", (b) => [b.heading({ level: 3 }, "Hello")])
  .shouldParseDOM("<h6>Hello</h6>", (b) => [b.heading({ level: 6 }, "Hello")])
  .shouldRenderDOM((b) => [b.heading({ level: 1 }, "Hello")], "<h1>Hello</h1>")
  .shouldRenderDOM((b) => [b.heading({ level: 4 }, "Hello")], "<h4>Hello</h4>")
  .shouldSupportKeymap(
    (b) => [b.heading({ level: 2 }, "Hello")],
    "start",
    "{Shift-Tab}",
    (b) => [b.heading({ level: 1 }, "Hello")],
    "# Hello",
  )
  .shouldSupportKeymap(
    (b) => [b.heading({ level: 1 }, "Hello")],
    "start",
    "{Shift-Tab}",
    (b) => [b.p("Hello")],
    "Hello",
  )
  .shouldReportKeymapApplicability(
    (b) => [b.heading({ level: 2 }, "Hello")],
    1,
    "Shift-Tab",
    true,
  )
  .shouldReportKeymapApplicability(
    (b) => [b.heading({ level: 2 }, "Hello")],
    { from: 2, to: 4 },
    "#",
    false,
  )
  .test();
