import type { Node as UnistNode } from "unist";

import { OrderedListExtension } from "../../src/syntax-extensions/OrderedListExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new OrderedListExtension(), {
  proseMirrorNodeName: "ordered_list",
  unistNodeName: "list",
})
  .shouldMatchUnistNode({ children: [], ordered: true, type: "list" })
  .shouldMatchUnistNode({
    children: [],
    ordered: true,
    spread: true,
    type: "list",
  })
  .shouldMatchUnistNode({
    children: [],
    ordered: true,
    spread: true,
    start: 1,
    type: "list",
  })
  .shouldMatchUnistNode({
    children: [],
    ordered: true,
    spread: true,
    start: 42,
    type: "list",
  })
  .shouldNotMatchUnistNode({
    children: [],
    ordered: false,
    type: "list",
  } as UnistNode)
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: true,
      type: "list",
    },
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: true,
      spread: true,
      type: "list",
    },
    (schema) => [
      schema.nodes["ordered_list"].create({ spread: true }, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: true,
      spread: true,
      start: 42,
      type: "list",
    },
    (schema) => [
      schema.nodes["ordered_list"].create({ spread: true, start: 42 }, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ children: [], type: "listItem" }],
      ordered: true,
      type: "list",
    },
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ children: [], spread: true, type: "listItem" }],
      ordered: true,
      type: "list",
    },
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
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
      ordered: true,
      type: "list",
    },
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
  )
  .shouldMatchProseMirrorNode((schema) => schema.nodes["ordered_list"].create())
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["ordered_list"].create({ spread: true }),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["ordered_list"].create({ spread: true, start: 42 }),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["ordered_list"].create({}, [
      schema.nodes["regular_list_item"].create(),
    ]),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["ordered_list"].create({}, [
      schema.nodes["regular_list_item"].create({ spread: true }),
    ]),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["ordered_list"].create({}, [
      schema.nodes["regular_list_item"].create({}, [
        schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
      ]),
    ]),
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["ordered_list"].create({}, [
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
        ordered: true,
        spread: false,
        start: 1,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["ordered_list"].create({ spread: true }, [
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
        ordered: true,
        spread: true,
        start: 1,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["ordered_list"].create({ spread: true, start: 42 }, [
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
        ordered: true,
        spread: true,
        start: 42,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["ordered_list"].create({}, [
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
        ordered: true,
        spread: false,
        start: 1,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["ordered_list"].create({ spread: true }, [
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
        ordered: true,
        spread: true,
        start: 1,
        type: "list",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["ordered_list"].create({}, [
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
        ordered: true,
        spread: false,
        start: 1,
        type: "list",
      },
    ],
  )
  .shouldMatchInputRule(
    "1. ",
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    ],
    "1.",
  )
  .shouldMatchInputRule(
    "1. Hello World!",
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    " 1. Hello World!",
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    "  1. Hello World!",
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    "   1. Hello World!",
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
    "1. Hello World!",
  )
  .shouldMatchInputRule(
    "42. Hello World!",
    (schema) => [
      schema.nodes["ordered_list"].create({ start: 42 }, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
    "42. Hello World!",
  )
  /* TODO: Enable when jest-prosemirror supports input rules with Enter
  .shouldMatchInputRule(
    "1. Hello World!\n\n\n2. Second item",
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Second line")]),
        ]),
      ]),
    ],
    "1. Hello World!\n2. Second item",
  )
  */
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("Hello")])],
    3,
    "9",
    { ctrlKey: true, shiftKey: true },
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
      ]),
    ],
    "1. Hello",
  )
  /* TODO: Re-enable when jest-prosemirror can handle keymaps with Enter
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
      ]),
    ],
    3,
    "Enter",
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hel")]),
        ]),
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("lo")]),
        ]),
      ]),
    ],
    "1. Hel\n2. lo",
  )
  */
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
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
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    "1. Hello\n2. World",
  )
  /* TODO: Re-enable once jest-prosemirror can handle keymaps with Tab
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
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
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
          schema.nodes["ordered_list"].create({}, [
            schema.nodes["regular_list_item"].create({}, [
              schema.nodes["paragraph"].create({}, [schema.text("World")]),
            ]),
          ]),
        ]),
      ]),
    ],
    "1. Hello\n    1. World",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
          schema.nodes["ordered_list"].create({}, [
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
      schema.nodes["ordered_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    "1. Hello\n2. World",
  )
  */
  .test();
