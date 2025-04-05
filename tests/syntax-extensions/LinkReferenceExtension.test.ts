import type { Node as UnistNode } from "unist";

import { LinkReferenceExtension } from "../../src/syntax-extensions/LinkReferenceExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new LinkReferenceExtension(), {
  proseMirrorMarkName: null,
  unistNodeName: "linkReference",
})
  .shouldMatchUnistNode({
    children: [],
    identifier: "linkId",
    referenceType: "full",
    type: "linkReference",
  })
  .shouldMatchUnistNode({
    children: [],
    identifier: "linkId",
    referenceType: "collapsed",
    type: "linkReference",
  })
  .shouldMatchUnistNode({
    children: [],
    identifier: "linkId",
    referenceType: "shortcut",
    type: "linkReference",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Click me!" }],
      identifier: "linkId",
      referenceType: "full",
      type: "linkReference",
    },
    (schema) => [
      schema
        .text("Click me!")
        .mark([schema.marks["link"].create({ href: "https://example.test" })]),
    ],
    [
      {
        identifier: "linkId",
        type: "definition",
        url: "https://example.test",
      } as UnistNode,
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Click me!" }],
      identifier: "linkId",
      referenceType: "collapsed",
      type: "linkReference",
    },
    (schema) => [
      schema
        .text("Click me!")
        .mark([schema.marks["link"].create({ href: "https://example.test" })]),
    ],
    [
      {
        identifier: "linkId",
        type: "definition",
        url: "https://example.test",
      } as UnistNode,
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Click me!" }],
      identifier: "linkId",
      referenceType: "shortcut",
      type: "linkReference",
    },
    (schema) => [
      schema
        .text("Click me!")
        .mark([schema.marks["link"].create({ href: "https://example.test" })]),
    ],
    [
      {
        identifier: "linkId",
        type: "definition",
        url: "https://example.test",
      } as UnistNode,
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Click me!" }],
      identifier: "linkId",
      referenceType: "full",
      type: "linkReference",
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
        identifier: "linkId",
        title: "This link has a title",
        type: "definition",
        url: "https://example.test",
      } as UnistNode,
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Click me!" }],
      identifier: "linkId",
      referenceType: "full",
      type: "linkReference",
    },
    (schema) => [
      schema.text("Click me!").mark([
        schema.marks["link"].create({
          href: null,
        }),
      ]),
    ],
  )
  .test();
