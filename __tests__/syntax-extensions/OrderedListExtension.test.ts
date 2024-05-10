import type { Node as UnistNode } from "unist";

import { OrderedListExtension } from "../../src/syntax-extensions/OrderedListExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new OrderedListExtension(), {
  proseMirrorNodeName: "ordered_list",
  unistNodeName: "list",
})
  .shouldMatchUnistNode({ type: "list", ordered: true, children: [] })
  .shouldMatchUnistNode({
    type: "list",
    ordered: true,
    spread: true,
    children: [],
  })
  .shouldMatchUnistNode({
    type: "list",
    ordered: true,
    spread: true,
    start: 1,
    children: [],
  })
  .shouldMatchUnistNode({
    type: "list",
    ordered: true,
    spread: true,
    start: 42,
    children: [],
  })
  .shouldNotMatchUnistNode({
    type: "list",
    ordered: false,
    children: [],
  } as UnistNode)
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: true,
      children: [],
    },
    (schema) => [schema.nodes.ordered_list.createAndFill()!],
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: true,
      spread: true,
      children: [],
    },
    (schema) => [schema.nodes.ordered_list.createAndFill({ spread: true })!],
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: true,
      spread: true,
      start: 42,
      children: [],
    },
    (schema) => [
      schema.nodes.ordered_list.createAndFill({ spread: true, start: 42 })!,
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: true,
      children: [{ type: "listItem", children: [] }],
    },
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill()!,
      ])!,
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: true,
      children: [{ type: "listItem", spread: true, children: [] }],
    },
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({ spread: true })!,
      ])!,
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: true,
      children: [
        {
          type: "listItem",
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", value: "Hello World!" }],
            },
          ],
        },
      ],
    },
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes.ordered_list.createAndFill()!,
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes.ordered_list.createAndFill({ spread: true })!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.ordered_list.createAndFill({ spread: true, start: 42 })!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill()!,
      ])!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({ spread: true })!,
      ])!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes.ordered_list.createAndFill()!,
    [
      {
        type: "list",
        ordered: true,
        spread: false,
        start: 1,
        children: [
          {
            type: "listItem",
            spread: false,
            children: [{ type: "paragraph", children: [] }],
          },
        ],
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes.ordered_list.createAndFill({ spread: true })!,
    [
      {
        type: "list",
        ordered: true,
        spread: true,
        start: 1,
        children: [
          {
            type: "listItem",
            spread: true,
            children: [{ type: "paragraph", children: [] }],
          },
        ],
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.ordered_list.createAndFill({ spread: true, start: 42 })!,
    [
      {
        type: "list",
        ordered: true,
        spread: true,
        start: 42,
        children: [
          {
            type: "listItem",
            spread: true,
            children: [{ type: "paragraph", children: [] }],
          },
        ],
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill()!,
      ])!,
    [
      {
        type: "list",
        ordered: true,
        spread: false,
        start: 1,
        children: [
          {
            type: "listItem",
            spread: false,
            children: [{ type: "paragraph", children: [] }],
          },
        ],
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.ordered_list.createAndFill({ spread: true }, [
        schema.nodes.list_item.createAndFill({ spread: true })!,
      ])!,
    [
      {
        type: "list",
        ordered: true,
        spread: true,
        start: 1,
        children: [
          {
            type: "listItem",
            spread: true,
            children: [{ type: "paragraph", children: [] }],
          },
        ],
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    [
      {
        type: "list",
        ordered: true,
        spread: false,
        start: 1,
        children: [
          {
            type: "listItem",
            spread: false,
            children: [
              {
                type: "paragraph",
                children: [{ type: "text", value: "Hello World!" }],
              },
            ],
          },
        ],
      },
    ],
  )
  .shouldMatchInputRule(
    "1. ",
    (schema) => [schema.nodes.ordered_list.createAndFill()!],
    "1.",
  )
  .shouldMatchInputRule(
    "1. Hello World!",
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    " 1. Hello World!",
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    "  1. Hello World!",
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    "   1. Hello World!",
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    "42. Hello World!",
    (schema) => [
      schema.nodes.ordered_list.createAndFill({ start: 42 }, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "42. Hello World!",
  )
  /*
  .shouldMatchInputRule(
    "1. Hello World!\n\n\n2. Second item",
    (schema) => [
      schema.nodes["ordered_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
        schema.nodes["list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Second line"),
          ])!,
        ])!,
      ])!,
    ],
    "1. Hello World!\n2. Second item"
  )
  */
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
    ],
    3,
    "Shift-Mod-9",
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
      ])!,
    ],
    "1. Hello",
  )
  /* TODO: Re-enable when jest-prosemirror can handle keymaps with Enter
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
      ])!,
    ],
    3,
    "Enter",
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hel")])!,
        ])!,
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("lo")])!,
        ])!,
      ])!,
    ],
    "1. Hel\n2. lo",
  )
  */
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    3,
    "Tab",
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    "1. Hello\n2. World",
  )
  /* TODO: Re-enable once jest-prosemirror can handle keymaps with Tab
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    10,
    "Tab",
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
          schema.nodes.ordered_list.createAndFill({}, [
            schema.nodes.list_item.createAndFill({}, [
              schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
            ])!,
          ])!,
        ])!,
      ])!,
    ],
    "1. Hello\n    1. World",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
          schema.nodes.ordered_list.createAndFill({}, [
            schema.nodes.list_item.createAndFill({}, [
              schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
            ])!,
          ])!,
        ])!,
      ])!,
    ],
    10,
    "Shift-Tab",
    (schema) => [
      schema.nodes.ordered_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    "1. Hello\n2. World",
  )
  */
  .test();
