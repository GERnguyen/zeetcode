import type { ProblemDetail } from "../../../types/domain";
import { renderRichText } from "../../../lib/markdown/renderRichText";

export function EditorialContent({ problem }: { problem: ProblemDetail }) {
  return (
    <div className="markdown-body">
      {problem.editorial?.videoLink && (
        <a href={problem.editorial.videoLink} target="_blank">
          Open video editorial
        </a>
      )}
      {problem.editorial?.text ? (
        <div
          dangerouslySetInnerHTML={{
            __html: renderRichText(problem.editorial.text),
          }}
        />
      ) : (
        <p>No editorial yet.</p>
      )}
    </div>
  );
}
