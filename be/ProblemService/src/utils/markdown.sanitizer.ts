import logger from "../config/logger.config";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import TurndownService from "turndown";

export async function sanitizeMarkdown(markdown: string): Promise<string> {
  if (!markdown || typeof markdown !== "string") return markdown;

  try {
    const convertedHtml = await marked.parse(markdown);

    const sanitizedHtml = sanitizeHtml(convertedHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "img",
        "code",
        "pre",
      ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ["src", "alt", "title"],
        code: ["class"],
        pre: ["class"],
        a: ["href", "title"],
      },
      allowedSchemes: ["http", "https"],
      allowedSchemesByTag: {
        img: ["http", "https"],
      },
    });

    const tds = new TurndownService();

    return tds.turndown(sanitizedHtml);
  } catch (error) {
    logger.error("Error sanitizing markdown:", error);
    return "";
  }
}
