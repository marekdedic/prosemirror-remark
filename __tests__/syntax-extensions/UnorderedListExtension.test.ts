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
    (schema) => [schema.nodes["bullet_list"].createAndFill()!]
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: false,
      spread: true,
      children: [],
    },
    (schema) => [schema.nodes["bullet_list"].createAndFill({ spread: true })!]
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: false,
      children: [{ type: "listItem", children: [] }],
    },
    (schema) => [
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill()!,
      ])!,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "list",
      ordered: false,
      children: [{ type: "listItem", spread: true, children: [] }],
    },
    (schema) => [
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({ spread: true })!,
      ])!,
    ]
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
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ]
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes["bullet_list"].createAndFill()!
  )
  .shouldMatchProseMirrorNode(
    (schema) => schema.nodes["bullet_list"].createAndFill({ spread: true })!
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill()!,
      ])!
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({ spread: true })!,
      ])!
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["bullet_list"].createAndFill()!,
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
    ]
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["bullet_list"].createAndFill({ spread: true })!,
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
    ]
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill()!,
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
    ]
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["bullet_list"].createAndFill({ spread: true }, [
        schema.nodes["list_item"].createAndFill({ spread: true })!,
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
    ]
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
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
    ]
  )
  .shouldMatchInputRule(
    "* ",
    (schema) => [schema.nodes["bullet_list"].createAndFill()!],
    "*"
  )
  .shouldMatchInputRule(
    "* Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    // TODO: Investigate the triple space - it doesn't occur with 42
    "*   Hello World!"
  )
  .shouldMatchInputRule(
    "- Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "*   Hello World!"
  )
  .shouldMatchInputRule(
    "+ Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "*   Hello World!"
  )
  .shouldMatchInputRule(
    " * Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "*   Hello World!"
  )
  .shouldMatchInputRule(
    "  * Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "*   Hello World!"
  )
  .shouldMatchInputRule(
    "   * Hello World!",
    (schema) => [
      schema.nodes["bullet_list"].createAndFill({}, [
        schema.nodes["list_item"].createAndFill({}, [
          schema.nodes["paragraph"].createAndFill({}, [
            schema.text("Hello World!"),
          ])!,
        ])!,
      ])!,
    ],
    "*   Hello World!"
  )
  /*
  TODO: Fix this test of joining lists - probably \n != Enter key
  .shouldMatchInputRule(
    "* Hello World!\n\n\n2. Second item",
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
  .test();
