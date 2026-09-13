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
    (b) => [b.img({ src: "https://example.test" })],
  )
  .shouldConvertUnistNode(
    {
      alt: "Awesome image",
      type: "image",
      url: "https://example.test",
    },
    (b) => [
      b.img({
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
    (b) => [
      b.img({
        alt: "Awesome image",
        src: "https://example.test",
        title: "Image title",
      }),
    ],
  )
  .shouldMatchProseMirrorNode((b) => b.img({ src: "https://example.test" }))
  .shouldMatchProseMirrorNode((b) =>
    b.img({
      alt: "Awesome image",
      src: "https://example.test",
    }),
  )
  .shouldMatchProseMirrorNode((b) =>
    b.img({
      alt: "Awesome image",
      src: "https://example.test",
      title: "Image title",
    }),
  )
  .shouldConvertProseMirrorNode(
    (b) => b.img({ src: "https://example.test" }),
    [{ type: "image", url: "https://example.test" }],
  )
  .shouldConvertProseMirrorNode(
    (b) =>
      b.img({
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
    (b) =>
      b.img({
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
  .shouldParseDOM('<p><img src="https://example.test/i.png"></p>', (b) => [
    b.p(b.img({ src: "https://example.test/i.png" })),
  ])
  .shouldParseDOM(
    '<p><img src="https://example.test/i.png" alt="Alt" title="Title"></p>',
    (b) => [
      b.p(
        b.img({
          alt: "Alt",
          src: "https://example.test/i.png",
          title: "Title",
        }),
      ),
    ],
  )
  .shouldParseDOM('<p><img alt="No source"></p>', (b) => [b.p()])
  .shouldRenderDOM(
    (b) => [b.p(b.img({ src: "https://example.test/i.png" }))],
    '<p><img src="https://example.test/i.png"></p>',
  )
  .test();
