import type { ProblemDetail } from "../../../types/domain";
import { renderRichText } from "../../../lib/markdown/renderRichText";

export function ProblemContent({ problem }: { problem: ProblemDetail }) {
  return (
    <article className="markdown-body">
      <h2>{problem.title}</h2>
      <small className={`difficulty-${problem.difficulty} font-black`}>
        {problem.difficulty}
      </small>
      <div
        dangerouslySetInnerHTML={{ __html: renderRichText(problem.description) }}
      />
      <div className="grid gap-3">
        {problem.examples.map((example, index) => (
          <pre key={index}>
            <strong>Example {index + 1}</strong>
            {`\nInput:\n${example.input}\nOutput:\n${example.output}`}
          </pre>
        ))}
      </div>
    </article>
  );
}
