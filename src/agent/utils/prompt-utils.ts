/**
 * Utility functions for working with prompts
 */

/**
 * Formats structured data for inclusion in a prompt
 * @param data The data to format
 * @returns Properly formatted string representation
 */
export function formatDataForPrompt(data: unknown): string {
  if (typeof data === "object" && data !== null) {
    return JSON.stringify(data, null, 2);
  }
  return String(data);
}

/**
 * Creates a template function that replaces placeholders in a template string
 * @param template The template string with {{placeholders}}
 * @returns A function that accepts values and returns the filled template
 */
export function createTemplate(template: string) {
  return (values: Record<string, string | number | boolean>) => {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const value = values[key.trim()];
      return value !== undefined ? String(value) : `{{${key}}}`;
    });
  };
}

/**
 * Creates a structured prompt from multiple sections
 * @param sections Key-value pairs of section names and content
 * @returns Formatted prompt with labeled sections
 */
export function createStructuredPrompt(
  sections: Record<string, string>
): string {
  return Object.entries(sections)
    .map(([title, content]) => {
      return `<${title}>\n${content}\n</${title}>`;
    })
    .join("\n\n");
}

/**
 * Truncates text to fit within token limits
 * @param text The text to truncate
 * @param maxLength Maximum character length (rough approximation of tokens)
 * @returns Truncated text
 */
export function truncateForTokenLimit(text: string, maxLength = 8000): string {
  if (text.length <= maxLength) return text;

  // Simple truncation - in production, use a proper tokenizer
  return `${text.substring(0, maxLength - 3)}...`;
}
