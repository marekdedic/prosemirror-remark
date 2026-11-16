import type {
  Fragment,
  Mark,
  Node as ProseMirrorNode,
} from "prosemirror-model";

// A URL with a scheme, as mdast-util-to-markdown requires to write a link as
// an autolink
const absoluteUrl = /^[a-z][+\-.a-z]+:/iu;

// An email address as a CommonMark email autolink allows it
const email =
  /^[\w!#$%&'*+\-./=?^`{|}~]+@[0-9A-Za-z](?:[-0-9A-Za-z]{0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:[-0-9A-Za-z]{0,61}[0-9A-Za-z])?)*$/u;

// The href for the new text of a link whose old text showed its old href, in
// the same form, as autolinks have it: the text itself for an absolute URL,
// an email address with "mailto:", or a GFM "www." literal with "http://".
// Null for any other link, such as one to a relative URL, and when the text
// no longer has that form.
export function autolinkHrefForText(
  text: string,
  oldText: string,
  oldHref: string,
): string | null {
  // Text with whitespace, which a URL can't contain, or with control
  // characters or angle brackets, which mdast-util-to-markdown doesn't write
  // in an autolink, stops following
  if (/[\s\p{Cc}<>]/u.test(text)) {
    return null;
  }
  if (oldText === oldHref) {
    return absoluteUrl.test(oldHref) && absoluteUrl.test(text) ? text : null;
  }
  if (oldHref === `mailto:${oldText}`) {
    return email.test(text) ? `mailto:${text}` : null;
  }
  if (oldHref === `http://${oldText}`) {
    return /^w{3}\./iu.test(text) ? `http://${text}` : null;
  }
  return null;
}

// The text an autolink shows for the href: an email address without its
// "mailto:", and any other href as it is
export function autolinkText(href: string): string {
  const address = href.startsWith("mailto:") ? href.slice(7) : "";
  return email.test(address) ? address : href;
}

// Whether the content is text with the same marks throughout
export function isUniformText(content: Fragment): boolean {
  for (let i = 0; i < content.childCount; i++) {
    const child = content.child(i);
    if (!child.isText || !child.sameMarkup(content.child(0))) {
      return false;
    }
  }
  return true;
}

// Whether the text between from and to is plain text with the link, all with
// the same marks, showing the link's href as an autolink does
export function showsHref(
  doc: ProseMirrorNode,
  from: number,
  to: number,
  mark: Mark,
): boolean {
  const href = mark.attrs["href"] as string | null;
  if (href === null || href === "") {
    return false;
  }
  const { content } = doc.slice(from, to);
  return (
    isUniformText(content) &&
    mark.isInSet(content.firstChild?.marks ?? []) &&
    textShowsHref(content.textBetween(0, content.size), href)
  );
}

// Whether the text is the href as an autolink shows it. That includes a GFM
// "www." literal, whose href gets "http://".
function textShowsHref(text: string, href: string): boolean {
  return (
    text === href ||
    text === autolinkText(href) ||
    (/^w{3}\./iu.test(text) && href === `http://${text}`)
  );
}
