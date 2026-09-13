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
    (b) => [b.link({ href: "https://example.test" }, "Click me!")],
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
    (b) => [b.link({ href: "https://example.test" }, "Click me!")],
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
    (b) => [b.link({ href: "https://example.test" }, "Click me!")],
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
    (b) => [
      b.link(
        {
          href: "https://example.test",
          title: "This link has a title",
        },
        "Click me!",
      ),
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
    (b) => [
      b.link(
        {
          href: null,
        },
        "Click me!",
      ),
    ],
  )
  // A reference whose definition is missing, while other definitions do exist,
  // Must be left with no href rather than picking up an unrelated definition.
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Click me!" }],
      identifier: "linkId",
      referenceType: "full",
      type: "linkReference",
    },
    (b) => [
      b.link(
        {
          href: null,
        },
        "Click me!",
      ),
    ],
    [
      {
        identifier: "otherId",
        type: "definition",
        url: "https://example.test",
      } as UnistNode,
    ],
  )
  .test();
