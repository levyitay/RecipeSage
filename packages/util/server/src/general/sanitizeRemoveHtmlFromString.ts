import sanitizeHtml from "sanitize-html";

export const sanitizeRemoveHtmlFromString = (input: string): string => {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
};
