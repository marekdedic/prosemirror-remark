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
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: false,
      spread: true,
      type: "list",
    },
    (schema) => [
      schema.nodes["bullet_list"].create({ spread: true }, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ children: [], type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ children: [], spread: true, type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({ spread: true }, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
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
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
  )
  .shouldMatchProseMirrorNode((schema) => schema.nodes["bullet_list"].create())
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["bullet_list"].create({ spread: true }),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["bullet_list"].create({}, [
      schema.nodes["regular_list_item"].create(),
    ]),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["bullet_list"].create({}, [
      schema.nodes["regular_list_item"].create({ spread: true }),
    ]),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["bullet_list"].create({}, [
      schema.nodes["regular_list_item"].create({}, [
        schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
      ]),
    ]),
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
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
      schema.nodes["bullet_list"].create({ spread: true }, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
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
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
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
      schema.nodes["bullet_list"].create({ spread: true }, [
        schema.nodes["regular_list_item"].create({ spread: true }, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
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
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
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
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    ],
    "*",
  )
  .shouldMatchInputRule(
    "* Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    "- Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    "+ Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    " * Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    "  * Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
    "* Hello World!",
  )
  .shouldMatchInputRule(
    " * Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
    "* Hello World!",
  )
  /* TODO: Enable when jest-prosemirror supports input rules with Enter
  .shouldMatchInputRule(
    "* Hello World!\n\n\n* Second item",
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Second line")]),
        ]),
      ]),
    ],
    "* Hello World!\n2. Second item",
  )
  */
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("Hello")])],
    3,
    "8",
    { ctrlKey: true, shiftKey: true },
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
      ]),
    ],
    "* Hello",
  )
  /* TODO: Re-enable when jest-prosemirror can handle keymaps with Enter
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
      ]),
    ],
    3,
    "Enter",
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hel")]),
        ]),
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("lo")]),
        ]),
      ]),
    ],
    "* Hel\n* lo",
  )
  */
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    3,
    "{Tab}",
    {},
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    "* Hello\n* World",
  )
  /* TODO: Re-enable once jest-prosemirror can handle keymaps with Tab
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    10,
    "Tab",
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
          schema.nodes["bullet_list"].create({}, [
            schema.nodes["regular_list_item"].create({}, [
              schema.nodes["paragraph"].create({}, [schema.text("World")]),
            ]),
          ]),
        ]),
      ]),
    ],
    "* Hello\n    * World",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
          schema.nodes["bullet_list"].create({}, [
            schema.nodes["regular_list_item"].create({}, [
              schema.nodes["paragraph"].create({}, [schema.text("World")]),
            ]),
          ]),
        ]),
      ]),
    ],
    10,
    "Shift-Tab",
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    "* Hello\n* World",
  )
  */
  .test();
