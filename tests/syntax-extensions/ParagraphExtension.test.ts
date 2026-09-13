import { ParagraphExtension } from "../../src/syntax-extensions/ParagraphExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new ParagraphExtension(), {
  proseMirrorNodeName: "paragraph",
  unistNodeName: "paragraph",
})
  .shouldMatchUnistNode({ children: [], type: "paragraph" })
  .shouldMatchUnistNode({
    children: [{ type: "text", value: "Hello World!" }],
    type: "paragraph",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ children: [], type: "paragraph" }, (b) => [b.p()])
  .shouldConvertUnistNode(
    { children: [{ type: "text", value: "Hello World!" }], type: "paragraph" },
    (b) => [b.p("Hello World!")],
  )
  .shouldMatchProseMirrorNode((b) => b.p())
  .shouldMatchProseMirrorNode((b) => b.p("Hello World!"))
  .shouldConvertProseMirrorNode(
    (b) => b.p(),
    [{ children: [], type: "paragraph" }],
  )
  .shouldConvertProseMirrorNode(
    (b) => b.p("Hello World!"),
    [
      {
        children: [{ type: "text", value: "Hello World!" }],
        type: "paragraph",
      },
    ],
  )
  .test();
