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
    (schema) => [
      schema.nodes["heading"].createAndFill(
        {
          level: 1,
        },
        [schema.text("Hello World!")],
      )!,
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Hello World!" }],
      depth: 3,
      type: "heading",
    },
    (schema) => [
      schema.nodes["heading"].createAndFill(
        {
          level: 3,
        },
        [schema.text("Hello World!")],
      )!,
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Hello World!" }],
      depth: 6,
      type: "heading",
    },
    (schema) => [
      schema.nodes["heading"].createAndFill(
        {
          level: 6,
        },
        [schema.text("Hello World!")],
      )!,
    ],
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes["heading"].createAndFill({ level: 1 })!,
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes["heading"].createAndFill({ level: 3 })!,
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes["heading"].createAndFill({ level: 6 })!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes["heading"].createAndFill({ level: 3 }, [
        schema.text("Hello World!"),
      ])!,
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["heading"].createAndFill({ level: 4 })!,
    [{ children: [], depth: 4, type: "heading" }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["heading"].createAndFill({ level: 1 }, [
        schema.text("Hello World!"),
      ])!,
    [
      {
        children: [{ type: "text", value: "Hello World!" }],
        depth: 1,
        type: "heading",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["heading"].createAndFill({ level: 3 }, [
        schema.text("Hello World!"),
      ])!,
    [
      {
        children: [{ type: "text", value: "Hello World!" }],
        depth: 3,
        type: "heading",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["heading"].createAndFill({ level: 6 }, [
        schema.text("Hello World!"),
      ])!,
    [
      {
        children: [{ type: "text", value: "Hello World!" }],
        depth: 6,
        type: "heading",
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
      schema.nodes["heading"].createAndFill({ level: 1 }, [
        schema.text("Hello"),
      ])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 2 }, [
        schema.text("Hello"),
      ])!,
    ],
    "## Hello",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 2 }, [
        schema.text("Hello"),
      ])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 3 }, [
        schema.text("Hello"),
      ])!,
    ],
    "### Hello",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 3 }, [
        schema.text("Hello"),
      ])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 4 }, [
        schema.text("Hello"),
      ])!,
    ],
    "#### Hello",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 4 }, [
        schema.text("Hello"),
      ])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 5 }, [
        schema.text("Hello"),
      ])!,
    ],
    "##### Hello",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 5 }, [
        schema.text("Hello"),
      ])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 6 }, [
        schema.text("Hello"),
      ])!,
    ],
    "###### Hello",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 6 }, [
        schema.text("Hello"),
      ])!,
    ],
    "start",
    "#",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 6 }, [
        schema.text("Hello"),
      ])!,
    ],
    "###### Hello",
  )
  .shouldMatchInputRule(
    "# Hello World!",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 1 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "# Hello World!",
  )
  .shouldMatchInputRule(
    "## Hello World!",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 2 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "## Hello World!",
  )
  .shouldMatchInputRule(
    "### Hello World!",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 3 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "### Hello World!",
  )
  .shouldMatchInputRule(
    "#### Hello World!",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 4 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "#### Hello World!",
  )
  .shouldMatchInputRule(
    "##### Hello World!",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 5 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "##### Hello World!",
  )
  .shouldMatchInputRule(
    "###### Hello World!",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 6 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "###### Hello World!",
  )
  .shouldMatchInputRule(
    " # Hello World!",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 1 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "# Hello World!",
  )
  .shouldMatchInputRule(
    "  # Hello World!",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 1 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "# Hello World!",
  )
  .shouldMatchInputRule(
    "   # Hello World!",
    (schema) => [
      schema.nodes["heading"].createAndFill({ level: 1 }, [
        schema.text("Hello World!"),
      ])!,
    ],
    "# Hello World!",
  )
  .shouldNotMatchInputRule("####### Hello World!", "\\####### Hello World!")
  .test();
