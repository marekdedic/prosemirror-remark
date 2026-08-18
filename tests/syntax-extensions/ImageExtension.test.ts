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
  .shouldParseDOM('<p><img src="https://example.test/i.png"></p>', (schema) => [
    schema.nodes["paragraph"].create({}, [
      schema.nodes["image"].create({ src: "https://example.test/i.png" }),
    ]),
  ])
  .shouldParseDOM(
    '<p><img src="https://example.test/i.png" alt="Alt" title="Title"></p>',
    (schema) => [
      schema.nodes["paragraph"].create({}, [
        schema.nodes["image"].create({
          alt: "Alt",
          src: "https://example.test/i.png",
          title: "Title",
        }),
      ]),
    ],
  )
  .shouldParseDOM('<p><img alt="No source"></p>', (schema) => [
    schema.nodes["paragraph"].create(),
  ])
  .shouldRenderDOM(
    (schema) => [
      schema.nodes["paragraph"].create({}, [
        schema.nodes["image"].create({ src: "https://example.test/i.png" }),
      ]),
    ],
    '<p><img src="https://example.test/i.png"></p>',
  )
  .test();
