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
      children: [{ checked: false, children: [], type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: false })!,
      ])!,
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ checked: true, children: [], type: "listItem" }],
      ordered: false,
      type: "list",
    },
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: true })!,
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: false }, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: true }, [
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
        schema.nodes.task_list_item.createAndFill({ checked: false })!,
      ])!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: true })!,
      ])!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: false }, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: true }, [
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill()!,
      ])!,
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: false })!,
      ])!,
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: true })!,
      ])!,
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
      schema.nodes.bullet_list.createAndFill({ spread: true }, [
        schema.nodes.task_list_item.createAndFill({
          checked: true,
          spread: true,
        })!,
      ])!,
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: true }, [
          schema.nodes.paragraph.createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
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
  /* TODO: Re-enable when jest-prosemirror can handle keymaps with Enter
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
      ])!,
    ],
    3,
    "Enter",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hel")])!,
        ])!,
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("lo")])!,
        ])!,
      ])!,
    ],
    "* [ ] Hel\n* [ ] lo",
  )
  */
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    3,
    "Tab",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    "* [ ] Hello\n* [ ] World",
  )
  /* TODO: Re-enable once jest-prosemirror can handle keymaps with Tab
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    10,
    "Tab",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
          schema.nodes.bullet_list.createAndFill({}, [
            schema.nodes.task_list_item.createAndFill({}, [
              schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
            ])!,
          ])!,
        ])!,
      ])!,
    ],
    "* [ ] Hello\n    * [ ] World",
  )
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
          schema.nodes.bullet_list.createAndFill({}, [
            schema.nodes.task_list_item.createAndFill({}, [
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
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    "* [ ] Hello\n* [ ] World",
  )
  */
  /* TODO: Re-enable when jest-prosemirrr supports keymaps with backspace
  .shouldSupportKeymap(
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    0,
    "Backspace",
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("Hello")])!,
        ])!,
        schema.nodes.task_list_item.createAndFill({}, [
          schema.nodes.paragraph.createAndFill({}, [schema.text("World")])!,
        ])!,
      ])!,
    ],
    "* Hello\n* [ ] World",
  )
  */
  .test();
