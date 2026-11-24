import type { Plugin } from "prosemirror-state";
import type { ProseMirrorEditor } from "vitest-prosemirror";

export function handleTextInput(
  editor: ProseMirrorEditor,
  plugin: Plugin,
  from: number,
  to: number,
  text: string,
): boolean {
  return editor.command((state, _dispatch, view) =>
    view === undefined
      ? false
      : (plugin.props.handleTextInput?.call(
          plugin,
          view,
          from,
          to,
          text,
          () => state.tr,
        ) ?? false),
  );
}
