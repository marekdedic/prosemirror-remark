import { HeadingExtension } from "../../src/syntax-extensions/HeadingExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new HeadingExtension(), {
  proseMirrorNodeName: "heading",
  unistNodeName: "heading",
})
  .shouldMatchUnistNode({ type: "heading", depth: 1, children: [] })
  .shouldMatchUnistNode({ type: "heading", depth: 3, children: [] })
  .shouldMatchUnistNode({ type: "heading", depth: 6, children: [] })
  .shouldMatchUnistNode({
    type: "heading",
    depth: 3,
    children: [{ type: "text", value: "Hello World!" }],
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "heading",
      depth: 1,
      children: [{ type: "text", value: "Hello World!" }],
    },
    (schema) => [
      schema.nodes.heading.createAndFill(
        {
          level: 1,
        },
        [schema.text("Hello World!")],
      )!,
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "heading",
      depth: 3,
      children: [{ type: "text", value: "Hello World!" }],
    },
    (schema) => [
      schema.nodes.heading.createAndFill(
        {
          level: 3,
        },
        [schema.text("Hello World!")],
      )!,
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "heading",
      depth: 6,
      children: [{ type: "text", value: "Hello World!" }],
    },
    (schema) => [
      schema.nodes.heading.createAndFill(
        {
          level: 6,
        },
        [schema.text("Hello World!")],
      )!,
    ],
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes.heading.createAndFill({ level: 1 })!,
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes.heading.createAndFill({ level: 3 })!,
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes.heading.createAndFill({ level: 6 })!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.heading.createAndFill({ level: 3 }, [
        schema.text("Hello World!"),
      ])!,
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes.heading.createAndFill({ level: 4 })!,
    [{ type: "heading", depth: 4, children: [] }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.heading.createAndFill({ level: 1 }, [
        schema.text("Hello World!"),
      ])!,
    [
      {
        type: "heading",
        depth: 1,
        children: [{ type: "text", value: "Hello World!" }],
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.heading.createAndFill({ level: 3 }, [
        schema.text("Hello World!"),
      ])!,
    [
      {
        type: "heading",
        depth: 3,
        children: [{ type: "text", value: "Hello World!" }],
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.heading.createAndFill({ level: 6 }, [
        schema.text("Hello World!"),
      ])!,
    [
      {
        type: "heading",
        depth: 6,
        children: [{ type: "text", value: "Hello World!" }],
      },
    ],
  )
  .shouldSupportKeymap(
    () => [],
    "start",
    "Tab",
    () => [],
    "",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 1 }, [schema.text("Hello")])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 2 }, [schema.text("Hello")])!,
    ],
    "## Hello",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 2 }, [schema.text("Hello")])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 3 }, [schema.text("Hello")])!,
    ],
    "### Hello",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 3 }, [schema.text("Hello")])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 4 }, [schema.text("Hello")])!,
    ],
    "#### Hello",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 4 }, [schema.text("Hello")])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 5 }, [schema.text("Hello")])!,
    ],
    "##### Hello",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 5 }, [schema.text("Hello")])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 6 }, [schema.text("Hello")])!,
    ],
    "###### Hello",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 6 }, [schema.text("Hello")])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 6 }, [schema.text("Hello")])!,
    ],
    "###### Hello",
  )
  .shouldMatchInputRule(
    "# Hello World!",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 1 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "# Hello World!",
  )
  .shouldMatchInputRule(
    "## Hello World!",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 2 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "## Hello World!",
  )
  .shouldMatchInputRule(
    "### Hello World!",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 3 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "### Hello World!",
  )
  .shouldMatchInputRule(
    "#### Hello World!",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 4 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "#### Hello World!",
  )
  .shouldMatchInputRule(
    "##### Hello World!",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 5 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "##### Hello World!",
  )
  .shouldMatchInputRule(
    "###### Hello World!",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 6 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "###### Hello World!",
  )
  .shouldMatchInputRule(
    " # Hello World!",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 1 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "# Hello World!",
  )
  .shouldMatchInputRule(
    "  # Hello World!",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 1 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "# Hello World!",
  )
  .shouldMatchInputRule(
    "   # Hello World!",
    (schema) => [
      schema.nodes.heading.createAndFill({ level: 1 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "# Hello World!",
  )
  .shouldNotMatchInputRule("####### Hello World!", "\\####### Hello World!")
  .test();
