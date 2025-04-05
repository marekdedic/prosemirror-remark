import { ImageExtension } from "../../src/syntax-extensions/ImageExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new ImageExtension(), {
  proseMirrorNodeName: "image",
  unistNodeName: "image",
})
  .shouldMatchUnistNode({ type: "image", url: "https://example.test" })
  .shouldMatchUnistNode({
    alt: "Awesome image",
    type: "image",
    url: "https://example.test",
  })
  .shouldMatchUnistNode({
    alt: "Awesome image",
    title: "Image title",
    type: "image",
    url: "https://example.test",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    { type: "image", url: "https://example.test" },
    (schema) => [schema.nodes["image"].create({ src: "https://example.test" })],
  )
  .shouldConvertUnistNode(
    {
      alt: "Awesome image",
      type: "image",
      url: "https://example.test",
    },
    (schema) => [
      schema.nodes["image"].create({
        alt: "Awesome image",
        src: "https://example.test",
      }),
    ],
  )
  .shouldConvertUnistNode(
    {
      alt: "Awesome image",
      title: "Image title",
      type: "image",
      url: "https://example.test",
    },
    (schema) => [
      schema.nodes["image"].create({
        alt: "Awesome image",
        src: "https://example.test",
        title: "Image title",
      }),
    ],
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["image"].create({ src: "https://example.test" }),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["image"].create({
      alt: "Awesome image",
      src: "https://example.test",
    }),
  )
  .shouldMatchProseMirrorNode((schema) =>
    schema.nodes["image"].create({
      alt: "Awesome image",
      src: "https://example.test",
      title: "Image title",
    }),
  )
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["image"].create({ src: "https://example.test" }),
    [{ type: "image", url: "https://example.test" }],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["image"].create({
        alt: "Awesome image",
        src: "https://example.test",
      }),
    [
      {
        alt: "Awesome image",
        type: "image",
        url: "https://example.test",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["image"].create({
        alt: "Awesome image",
        src: "https://example.test",
        title: "Image title",
      }),
    [
      {
        alt: "Awesome image",
        title: "Image title",
        type: "image",
        url: "https://example.test",
      },
    ],
  )
  .test();
