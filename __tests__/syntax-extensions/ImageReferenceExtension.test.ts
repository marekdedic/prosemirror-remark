import type { Node as UnistNode } from "unist";

import { ImageReferenceExtension } from "../../src/syntax-extensions/ImageReferenceExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new ImageReferenceExtension(), {
  proseMirrorNodeName: null,
  unistNodeName: "imageReference",
})
  .shouldMatchUnistNode({
    type: "imageReference",
    referenceType: "full",
    identifier: "imageId",
  })
  .shouldMatchUnistNode({
    type: "imageReference",
    referenceType: "collapsed",
    identifier: "imageId",
  })
  .shouldMatchUnistNode({
    type: "imageReference",
    referenceType: "shortcut",
    identifier: "imageId",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "imageReference",
      referenceType: "full",
      identifier: "imageId",
    },
    (schema) => [
      schema.nodes["image"].createAndFill({ src: "https://example.test" })!,
    ],
    [
      {
        type: "definition",
        identifier: "imageId",
        url: "https://example.test",
      } as UnistNode,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "imageReference",
      referenceType: "collapsed",
      identifier: "imageId",
    },
    (schema) => [
      schema.nodes["image"].createAndFill({ src: "https://example.test" })!,
    ],
    [
      {
        type: "definition",
        identifier: "imageId",
        url: "https://example.test",
      } as UnistNode,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "imageReference",
      referenceType: "shortcut",
      identifier: "imageId",
    },
    (schema) => [
      schema.nodes["image"].createAndFill({ src: "https://example.test" })!,
    ],
    [
      {
        type: "definition",
        identifier: "imageId",
        url: "https://example.test",
      } as UnistNode,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "imageReference",
      referenceType: "full",
      identifier: "imageId",
      alt: "Awesome image",
    },
    (schema) => [
      schema.nodes["image"].createAndFill({
        src: "https://example.test",
        alt: "Awesome image",
        title: "Image title",
      })!,
    ],
    [
      {
        type: "definition",
        identifier: "imageId",
        url: "https://example.test",
        title: "Image title",
      } as UnistNode,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "imageReference",
      referenceType: "full",
      identifier: "imageId",
    },
    (schema) => [schema.nodes["image"].createAndFill({ src: "" })!]
  )
  .test();
