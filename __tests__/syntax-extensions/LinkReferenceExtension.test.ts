import type { Node as UnistNode } from "unist";

import { LinkReferenceExtension } from "../../src/syntax-extensions/LinkReferenceExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new LinkReferenceExtension(), {
  proseMirrorMarkName: null,
  unistNodeName: "linkReference",
})
  .shouldMatchUnistNode({
    type: "linkReference",
    identifier: "linkId",
    referenceType: "full",
    children: [],
  })
  .shouldMatchUnistNode({
    type: "linkReference",
    identifier: "linkId",
    referenceType: "collapsed",
    children: [],
  })
  .shouldMatchUnistNode({
    type: "linkReference",
    identifier: "linkId",
    referenceType: "shortcut",
    children: [],
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "linkReference",
      identifier: "linkId",
      referenceType: "full",
      children: [{ type: "text", value: "Click me!" }],
    },
    (schema) => [
      schema
        .text("Click me!")
        .mark([schema.marks["link"].create({ href: "https://example.test" })]),
    ],
    [
      {
        type: "definition",
        identifier: "linkId",
        url: "https://example.test",
      } as UnistNode,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "linkReference",
      identifier: "linkId",
      referenceType: "collapsed",
      children: [{ type: "text", value: "Click me!" }],
    },
    (schema) => [
      schema
        .text("Click me!")
        .mark([schema.marks["link"].create({ href: "https://example.test" })]),
    ],
    [
      {
        type: "definition",
        identifier: "linkId",
        url: "https://example.test",
      } as UnistNode,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "linkReference",
      identifier: "linkId",
      referenceType: "shortcut",
      children: [{ type: "text", value: "Click me!" }],
    },
    (schema) => [
      schema
        .text("Click me!")
        .mark([schema.marks["link"].create({ href: "https://example.test" })]),
    ],
    [
      {
        type: "definition",
        identifier: "linkId",
        url: "https://example.test",
      } as UnistNode,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "linkReference",
      identifier: "linkId",
      referenceType: "full",
      children: [{ type: "text", value: "Click me!" }],
    },
    (schema) => [
      schema.text("Click me!").mark([
        schema.marks["link"].create({
          href: "https://example.test",
          title: "This link has a title",
        }),
      ]),
    ],
    [
      {
        type: "definition",
        identifier: "linkId",
        url: "https://example.test",
        title: "This link has a title",
      } as UnistNode,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "linkReference",
      identifier: "linkId",
      referenceType: "full",
      children: [{ type: "text", value: "Click me!" }],
    },
    (schema) => [
      schema.text("Click me!").mark([
        schema.marks["link"].create({
          href: null,
        }),
      ]),
    ]
  )
  .test();
