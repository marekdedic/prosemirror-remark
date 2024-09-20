import type { Node as UnistNode } from "unist";

import { ImageReferenceExtension } from "../../src/syntax-extensions/ImageReferenceExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new ImageReferenceExtension(), {
  proseMirrorNodeName: null,
  unistNodeName: "imageReference",
})
  .shouldMatchUnistNode({
    identifier: "imageId",
    referenceType: "full",
    type: "imageReference",
  })
  .shouldMatchUnistNode({
    identifier: "imageId",
    referenceType: "collapsed",
    type: "imageReference",
  })
  .shouldMatchUnistNode({
    identifier: "imageId",
    referenceType: "shortcut",
    type: "imageReference",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      identifier: "imageId",
      referenceType: "full",
      type: "imageReference",
    },
    (schema) => [schema.nodes["image"].create({ src: "https://example.test" })],
    [
      {
        identifier: "imageId",
        type: "definition",
        url: "https://example.test",
      } as UnistNode,
    ],
  )
  .shouldConvertUnistNode(
    {
      identifier: "imageId",
      referenceType: "collapsed",
      type: "imageReference",
    },
    (schema) => [schema.nodes["image"].create({ src: "https://example.test" })],
    [
      {
        identifier: "imageId",
        type: "definition",
        url: "https://example.test",
      } as UnistNode,
    ],
  )
  .shouldConvertUnistNode(
    {
      identifier: "imageId",
      referenceType: "shortcut",
      type: "imageReference",
    },
    (schema) => [schema.nodes["image"].create({ src: "https://example.test" })],
    [
      {
        identifier: "imageId",
        type: "definition",
        url: "https://example.test",
      } as UnistNode,
    ],
  )
  .shouldConvertUnistNode(
    {
      alt: "Awesome image",
      identifier: "imageId",
      referenceType: "full",
      type: "imageReference",
    },
    (schema) => [
      schema.nodes["image"].create({
        alt: "Awesome image",
        src: "https://example.test",
        title: "Image title",
      }),
    ],
    [
      {
        identifier: "imageId",
        title: "Image title",
        type: "definition",
        url: "https://example.test",
      } as UnistNode,
    ],
  )
  .shouldConvertUnistNode(
    {
      identifier: "imageId",
      referenceType: "full",
      type: "imageReference",
    },
    (schema) => [schema.nodes["image"].create({ src: "" })],
  )
  .test();
