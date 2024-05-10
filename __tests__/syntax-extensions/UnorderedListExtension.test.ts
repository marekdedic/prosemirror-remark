import type { Node as UnistNode } from "unist";

import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new UnorderedListExtension(), {
  proseMirrorNodeName: "bullet_list",
  unistNodeName: "list",
})
  .shouldMatchUnistNode({ type: "list", ordered: false, children: [] })
  .shouldMatchUnistNode({
    type: "list",
    ordered: false,
    spread: true,
    children: [],
  })
  .shouldMatchUnistNode({
    type: "list",
    ordered: false,
    spread: true,
    children: [],
  })
  .shouldNotMatchUnistNode({
    type: "list",
    ordered: true,
    children: [],
  } as UnistNode)
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: false,
      children: [],
    },
    (schema) => [schema.nodes.bullet_list.createAndFill()!],
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: false,
      spread: true,
      children: [],
    },
    (schema) => [schema.nodes.bullet_list.createAndFill({ spread: true })!],
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: false,
      children: [{ type: "listItem", children: [] }],
    },
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill()!,
      ])!,
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: false,
      children: [{ type: "listItem", spread: true, children: [] }],
    },
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({ spread: true })!,
      ])!,
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: false,
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes.bullet_list.createAndFill()!,
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes.bullet_list.createAndFill({ spread: true })!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill()!,
      ])!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({ spread: true })!,
      ])!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes.bullet_list.createAndFill()!,
    [
      {
        type: "list",
        ordered: false,
        spread: false,
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
    (schema) => schema.nodes.bullet_list.createAndFill({ spread: true })!,
    [
      {
        type: "list",
        ordered: false,
        spread: true,
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill()!,
      ])!,
    [
      {
        type: "list",
        ordered: false,
        spread: false,
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
      schema.nodes.bullet_list.createAndFill({ spread: true }, [
        schema.nodes.list_item.createAndFill({ spread: true })!,
      ])!,
    [
      {
        type: "list",
        ordered: false,
        spread: true,
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    [
      {
        type: "list",
        ordered: false,
        spread: false,
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
    "* ",
    (schema) => [schema.nodes.bullet_list.createAndFill()!],
    "*",
  )
  .shouldMatchInputRule(
    "* Hello World!",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    "- Hello World!",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    "+ Hello World!",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    " * Hello World!",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    "  * Hello World!",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    " * Hello World!",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "* Hello World!",
  )
  /* TODO
  .shouldMatchInputRule(
    "* Hello World!\n\n\n* Second item",
    (schema) => [
      schema.nodes["bullet_list"].createAndFill({}, [
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
    "* Hello World!\n2. Second item"
  )
  */
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
    ],
    3,
    "Shift-Mod-8",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
      ])!,
    ],
    "* Hello",
  )
  /* TODO: Re-enable when jest-prosemirror can handle keymaps with Enter
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
      ])!,
    ],
    3,
    "Enter",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hel")])!,
        ])!,
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("lo")])!,
        ])!,
      ])!,
    ],
    "* Hel\n* lo",
  )
  */
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    "* Hello\n* World",
  )
  /* TODO: Re-enable once jest-prosemirror can handle keymaps with Tab
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
          schema.nodes.bullet_list.createAndFill({}, [
            schema.nodes.list_item.createAndFill({}, [
              schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
            ])!,
          ])!,
        ])!,
      ])!,
    ],
    "* Hello\n    * World",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
          schema.nodes.bullet_list.createAndFill({}, [
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    "* Hello\n* World",
  )
  */
  .test();
