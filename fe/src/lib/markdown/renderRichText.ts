import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import katex from "katex";
import "katex/dist/katex.min.css";

marked.use({
  gfm: true,
  breaks: true,
});

export function renderRichText(source?: string) {
  if (!source) return "";

  const fencedBlocks: string[] = [];
  const protectedSource = source.replace(/```[\s\S]*?```/g, (block) => {
    const token = `@@CODE_BLOCK_${fencedBlocks.length}@@`;
    fencedBlocks.push(block);
    return token;
  });

  const mathBlocks: string[] = [];
  const mathProtectedSource = protectedSource.replace(
    /\$([^$\n]+)\$/g,
    (_match, expression: string) => {
      const token = `@@MATH_BLOCK_${mathBlocks.length}@@`;
      const normalizedExpression = expression
        .replace(/\\\\(?=[a-zA-Z])/g, "\\")
        .trim();
      mathBlocks.push(
        katex.renderToString(normalizedExpression, {
          throwOnError: false,
          strict: false,
        }),
      );
      return token;
    },
  );

  const normalized = mathProtectedSource
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\s+(#{1,6}\s+)/g, "\n\n$1")
    .replace(/\s+(\*\*(Input|Output|Constraints|Example \d+):?\*\*)/gi, "\n\n$1")
    .replace(/(\*\*(Input|Output|Constraints|Example \d+):?\*\*)\s*-\s+/gi, "$1\n- ");

  const restoredCode = fencedBlocks.reduce(
    (text, block, index) => text.replace(`@@CODE_BLOCK_${index}@@`, block),
    normalized,
  );
  const parsedHtml = marked.parse(restoredCode, { async: false });
  const html = mathBlocks.reduce(
    (text, block, index) => text.replace(`@@MATH_BLOCK_${index}@@`, block),
    parsedHtml,
  );

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "pre",
      "code",
      "span",
      "math",
      "semantics",
      "mrow",
      "mi",
      "mo",
      "mn",
      "msup",
      "msub",
      "msubsup",
      "mfrac",
      "mtext",
      "annotation",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      annotation: ["encoding"],
      code: ["class"],
      math: ["xmlns"],
      span: ["class", "style", "aria-hidden"],
      img: ["src", "alt", "title"],
    },
  });
}
