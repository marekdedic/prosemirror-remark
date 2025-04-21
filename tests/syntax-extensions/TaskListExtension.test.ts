import type { Node as UnistNode } from "unist";

import { ListItemExtension } from "../../src/syntax-extensions/ListItemExtension";
import { TaskListItemExtension } from "../../src/syntax-extensions/TaskListItemExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

// TODO: Add input rule tests
new NodeExtensionTester(new UnorderedListExtension(), {
  otherExtensionsInTest: [new ListItemExtension(), new TaskListItemExtension()],
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
    children: [
      {
        checked: false,
        children: [
          { children: [{ type: "text", value: "Hello" }], type: "paragraph" },
        ],
        type: "listItem",
      },
    ],
    ordered: false,
    spread: true,
    type: "list",
  })
  .shouldMatchUnistNode({
    children: [
      {
        checked: true,
        children: [
          { children: [{ type: "text", value: "Hello" }], type: "paragraph" },
        ],
        type: "listItem",
      },
    ],
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
      children: [{ checked: false, children: [], type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({ checked: false }, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ checked: true, children: [], type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({ checked: true }, [
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
  .shouldConvertUnistNode(
    {
      children: [
        {
          checked: false,
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
        schema.nodes["task_list_item"].create({ checked: false }, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [
        {
          checked: true,
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
        schema.nodes["task_list_item"].create({ checked: true }, [
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
      schema.nodes["task_list_item"].create({ checked: false }),
    ]),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["bullet_list"].create({}, [
      schema.nodes["task_list_item"].create({ checked: true }),
    ]),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["bullet_list"].create({}, [
      schema.nodes["task_list_item"].create({ checked: false }, [
        schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
      ]),
    ]),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["bullet_list"].create({}, [
      schema.nodes["task_list_item"].create({ checked: true }, [
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
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    [
      {
        children: [
          {
            checked: false,
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
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({ checked: false }, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    [
      {
        children: [
          {
            checked: false,
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
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({ checked: true }, [
          schema.nodes["paragraph"].create(),
        ]),
      ]),
    [
      {
        children: [
          {
            checked: true,
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
        schema.nodes["task_list_item"].create(
          {
            checked: true,
            spread: true,
          },
          [schema.nodes["paragraph"].create()],
        ),
      ]),
    [
      {
        children: [
          {
            checked: true,
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
        schema.nodes["task_list_item"].create({ checked: true }, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello World!")]),
        ]),
      ]),
    [
      {
        children: [
          {
            checked: true,
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
  /* TODO
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
      ]),
    ],
    6,
    "{Enter}",
    {},
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hel")]),
        ]),
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("lo")]),
        ]),
      ]),
    ],
    "* [ ] Hel\n* [ ] lo",
  )
  */
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    3,
    "{Tab}",
    {},
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("\tHello")]),
        ]),
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    "* [ ] &#x9;Hello\n* [ ] World",
  )
  /* TODO
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    12,
    "{Tab}",
    {},
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
          schema.nodes["bullet_list"].create({}, [
            schema.nodes["task_list_item"].create({}, [
              schema.nodes["paragraph"].create({}, [schema.text("World")]),
            ]),
          ]),
        ]),
      ]),
    ],
    "* [ ] Hello\n    * [ ] World",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
          schema.nodes["bullet_list"].create({}, [
            schema.nodes["task_list_item"].create({}, [
              schema.nodes["paragraph"].create({}, [schema.text("World")]),
            ]),
          ]),
        ]),
      ]),
    ],
    10,
    "{Tab}",
    { shiftKey: true },
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    "* [ ] Hello\n* [ ] World",
  )
  */
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    0,
    "{Backspace}",
    {},
    (schema) => [
      schema.nodes["bullet_list"].create({}, [
        schema.nodes["regular_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("Hello")]),
        ]),
        schema.nodes["task_list_item"].create({}, [
          schema.nodes["paragraph"].create({}, [schema.text("World")]),
        ]),
      ]),
    ],
    "* Hello\n* [ ] World",
  )
  .test();
