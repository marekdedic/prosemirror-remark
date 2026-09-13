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
    (b) => [b.ul(b.li(b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [],
      ordered: false,
      spread: true,
      type: "list",
    },
    (b) => [b.ul({ spread: true }, b.li(b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [{ checked: false, children: [], type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (b) => [b.ul(b.taskListItem({ checked: false }, b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [{ checked: true, children: [], type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (b) => [b.ul(b.taskListItem({ checked: true }, b.p()))],
  )
  .shouldConvertUnistNode(
    {
      children: [{ children: [], spread: true, type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (b) => [b.ul(b.li({ spread: true }, b.p()))],
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
    (b) => [b.ul(b.li(b.p("Hello World!")))],
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
    (b) => [b.ul(b.taskListItem({ checked: false }, b.p("Hello World!")))],
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
    (b) => [b.ul(b.taskListItem({ checked: true }, b.p("Hello World!")))],
  )
  .shouldMatchProseMirrorNode((b) => b.ul())
  .shouldMatchProseMirrorNode((b) => b.ul({ spread: true }))
  .shouldMatchProseMirrorNode((b) => b.ul(b.li()))
  .shouldMatchProseMirrorNode((b) => b.ul(b.li({ spread: true })))
  .shouldMatchProseMirrorNode((b) => b.ul(b.taskListItem({ checked: false })))
  .shouldMatchProseMirrorNode((b) => b.ul(b.taskListItem({ checked: true })))
  .shouldMatchProseMirrorNode((b) =>
    b.ul(b.taskListItem({ checked: false }, b.p("Hello World!"))),
  )
  .shouldMatchProseMirrorNode((b) =>
    b.ul(b.taskListItem({ checked: true }, b.p("Hello World!"))),
  )
  .shouldConvertProseMirrorNode(
    (b) => b.ul(b.li(b.p())),
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
    (b) => b.ul(b.li(b.p())),
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
    (b) => b.ul(b.taskListItem(b.p())),
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
    (b) => b.ul(b.taskListItem({ checked: false }, b.p())),
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
    (b) => b.ul(b.taskListItem({ checked: true }, b.p())),
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
    (b) =>
      b.ul(
        { spread: true },
        b.taskListItem(
          {
            checked: true,
            spread: true,
          },
          b.p(),
        ),
      ),
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
    (b) => b.ul(b.taskListItem({ checked: true }, b.p("Hello World!"))),
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
    "{Shift-Tab}",
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
    (b) => [b.ul(b.taskListItem(b.p("Hello")), b.taskListItem(b.p("World")))],
    0,
    "{Backspace}",
    (b) => [b.ul(b.li(b.p("Hello")), b.taskListItem(b.p("World")))],
    "* Hello\n* [ ] World",
  )
  .test();
