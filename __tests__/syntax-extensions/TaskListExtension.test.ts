import type { Node as UnistNode } from "unist";

import { ListItemExtension } from "../../src/syntax-extensions/ListItemExtension";
import { TaskListItemExtension } from "../../src/syntax-extensions/TaskListItemExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

// TODO: Add input rule tests
new NodeExtensionTester(new UnorderedListExtension(), {
  proseMirrorNodeName: "bullet_list",
  unistNodeName: "list",
  otherExtensionsInTest: [new ListItemExtension(), new TaskListItemExtension()],
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
    children: [
      {
        type: "listItem",
        checked: false,
        children: [
          { type: "paragraph", children: [{ type: "text", value: "Hello" }] },
        ],
      },
    ],
  })
  .shouldMatchUnistNode({
    type: "list",
    ordered: false,
    spread: true,
    children: [
      {
        type: "listItem",
        checked: true,
        children: [
          { type: "paragraph", children: [{ type: "text", value: "Hello" }] },
        ],
      },
    ],
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
      children: [{ type: "listItem", children: [], checked: false }],
    },
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: false })!,
      ])!,
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: false,
      children: [{ type: "listItem", children: [], checked: true }],
    },
    (schema) => [
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill({ checked: true })!,
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
        schema.nodes.regular_list_item.createAndFill({ spread: true })!,
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
      type: "list",
      ordered: false,
      children: [
        {
          type: "listItem",
          checked: false,
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
      type: "list",
      ordered: false,
      children: [
        {
          type: "listItem",
          checked: true,
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.regular_list_item.createAndFill()!,
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
      schema.nodes.bullet_list.createAndFill({}, [
        schema.nodes.task_list_item.createAndFill()!,
      ])!,
    [
      {
        type: "list",
        ordered: false,
        spread: false,
        children: [
          {
            type: "listItem",
            checked: false,
            spread: false,
            children: [{ type: "paragraph", children: [] }],
          },
        ],
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
        type: "list",
        ordered: false,
        spread: false,
        children: [
          {
            type: "listItem",
            checked: false,
            spread: false,
            children: [{ type: "paragraph", children: [] }],
          },
        ],
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
        type: "list",
        ordered: false,
        spread: false,
        children: [
          {
            type: "listItem",
            checked: true,
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
        schema.nodes.task_list_item.createAndFill({
          checked: true,
          spread: true,
        })!,
      ])!,
    [
      {
        type: "list",
        ordered: false,
        spread: true,
        children: [
          {
            type: "listItem",
            checked: true,
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
        schema.nodes.task_list_item.createAndFill({ checked: true }, [
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
            checked: true,
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
  .test();
