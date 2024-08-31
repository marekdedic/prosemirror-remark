import type { Node as UnistNode } from "unist";

import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new UnorderedListExtension(), {
  proseMirrorNodeName: "bullet_list",
  unistNodeName: "list",
})
  .shouldMatchUnistNode({ children: [], ordered: false, type: "list" })
  .shouldMatchUnistNode({
    children: [],
    ordered: false,
    spread: true,
    type: "list",
  })
  .shouldMatchUnistNode({
    children: [],
    ordered: false,
    spread: true,
    type: "list",
  })
  .shouldNotMatchUnistNode({
    children: [],
    ordered: true,
    type: "list",
  } as UnistNode)
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: false,
      type: "list",
    },
    (schema) => [schema.nodes.bullet_list.createAndFill()!],
  )
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: false,
      spread: true,
      type: "list",
    },
    (schema) => [schema.nodes.bullet_list.createAndFill({ spread: true })!],
  )
  .shouldConvertUnistNode(
    {
      children: [{ children: [], type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill()!,
      ])!,
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ children: [], spread: true, type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill({ spread: true })!,
      ])!,
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [
        {
          children: [
            {
              children: [{ type: "text", value: "Hello World!" }],
              type: "paragraph",
            },
          ],
          type: "listItem",
        },
      ],
      ordered: false,
      type: "list",
    },
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill({}, [
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
        schema.nodes.regular_list_item.createAndFill()!,
      ])!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill({ spread: true })!,
      ])!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill({}, [
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
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: false,
            type: "listItem",
          },
        ],
        ordered: false,
        spread: false,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes.bullet_list.createAndFill({ spread: true })!,
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: true,
            type: "listItem",
          },
        ],
        ordered: false,
        spread: true,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill()!,
      ])!,
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: false,
            type: "listItem",
          },
        ],
        ordered: false,
        spread: false,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.bullet_list.createAndFill({ spread: true }, [
        schema.nodes.regular_list_item.createAndFill({ spread: true })!,
      ])!,
    [
      {
        children: [
          {
            children: [{ children: [], type: "paragraph" }],
            spread: true,
            type: "listItem",
          },
        ],
        ordered: false,
        spread: true,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    [
      {
        children: [
          {
            children: [
              {
                children: [{ type: "text", value: "Hello World!" }],
                type: "paragraph",
              },
            ],
            spread: false,
            type: "listItem",
          },
        ],
        ordered: false,
        spread: false,
        type: "list",
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
        schema.nodes.regular_list_item.createAndFill({}, [
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
        schema.nodes.regular_list_item.createAndFill({}, [
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
        schema.nodes.regular_list_item.createAndFill({}, [
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
        schema.nodes.regular_list_item.createAndFill({}, [
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
        schema.nodes.regular_list_item.createAndFill({}, [
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
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "* Hello World!",
  )
  /* TODO: Enable when jest-prosemirror supports input rules with Enter
  .shouldMatchInputRule(
    "* Hello World!\n\n\n* Second item",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Second line"),
          ])!,
        ])!,
      ])!,
    ],
    "* Hello World!\n2. Second item",
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
        schema.nodes.regular_list_item.createAndFill({}, [
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
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
      ])!,
    ],
    3,
    "Enter",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hel")])!,
        ])!,
        schema.nodes.regular_list_item.createAndFill({}, [
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
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    3,
    "Tab",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.regular_list_item.createAndFill({}, [
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
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    10,
    "Tab",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
          schema.nodes.bullet_list.createAndFill({}, [
            schema.nodes.regular_list_item.createAndFill({}, [
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
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
          schema.nodes.bullet_list.createAndFill({}, [
            schema.nodes.regular_list_item.createAndFill({}, [
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
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    "* Hello\n* World",
  )
  */
  .test();
