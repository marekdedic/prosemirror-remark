import { ImageExtension } from "../../src/syntax-extensions/ImageExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new ImageExtension(), {
  proseMirrorNodeName: "image",
  unistNodeName: "image",
})
  .shouldMatchUnistNode({ type: "image", url: "https://example.test" })
  .shouldMatchUnistNode({
    type: "image",
    url: "https://example.test",
    alt: "Awesome image",
  })
  .shouldMatchUnistNode({
    type: "image",
    url: "https://example.test",
    alt: "Awesome image",
    title: "Image title",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    { type: "image", url: "https://example.test" },
    (schema) => [
      schema.nodes["image"].createAndFill({ src: "https://example.test" })!,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "image",
      url: "https://example.test",
      alt: "Awesome image",
    },
    (schema) => [
      schema.nodes["image"].createAndFill({
        src: "https://example.test",
        alt: "Awesome image",
      })!,
    ]
  )
  .shouldConvertUnistNode(
    {
      type: "image",
      url: "https://example.test",
      alt: "Awesome image",
      title: "Image title",
    },
    (schema) => [
      schema.nodes["image"].createAndFill({
        src: "https://example.test",
        alt: "Awesome image",
        title: "Image title",
      })!,
    ]
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes["image"].createAndFill({ src: "https://example.test" })!
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes["image"].createAndFill({
        src: "https://example.test",
        alt: "Awesome image",
      })!
  )
  .shouldMatchProseMirrorNode(
    (schema) =>
      schema.nodes["image"].createAndFill({
        src: "https://example.test",
        alt: "Awesome image",
        title: "Image title",
      })!
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["image"].createAndFill({ src: "https://example.test" })!,
    [{ type: "image", url: "https://example.test" }]
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["image"].createAndFill({
        src: "https://example.test",
        alt: "Awesome image",
      })!,
    [
      {
        type: "image",
        url: "https://example.test",
        alt: "Awesome image",
      },
    ]
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.nodes["image"].createAndFill({
        src: "https://example.test",
        alt: "Awesome image",
        title: "Image title",
      })!,
    [
      {
        type: "image",
        url: "https://example.test",
        alt: "Awesome image",
        title: "Image title",
      },
    ]
  )
  .test();
