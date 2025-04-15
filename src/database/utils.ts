/**
 * Ensures that a given string is a valid URL, prepending https:// if necessary.
 * Returns undefined if the input is empty or invalid after attempting normalization.
 * @param urlString The potential URL string.
 * @returns A valid URL string or undefined.
 */
export function ensureValidUrl(urlString: string | undefined | null): string | undefined {
  if (!urlString) {
    return undefined;
  }

  let trimmedUrl = urlString.trim();

  if (!trimmedUrl) {
    return undefined;
  }

  // Prepend https:// if no scheme is present
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    trimmedUrl = `https://${trimmedUrl}`;
  }

  try {
    // Use the URL constructor to validate
    new URL(trimmedUrl);
    return trimmedUrl;
  } catch {
    // If the URL constructor throws, it's invalid
    console.warn(`⚠️ Invalid URL encountered and could not be normalized: ${urlString}`);
    return undefined;
  }
}

/**
 * Safely converts input data into a string array suitable for JSON fields.
 * Handles undefined/null, existing arrays, single strings, and JSON strings.
 * Returns undefined if the input is invalid or empty.
 * @param input The data to convert (string, string[], undefined, null).
 * @returns A string array or undefined.
 */
export function safeJsonArray(input: string | string[] | undefined | null): string[] | undefined {
  if (input === undefined || input === null) {
    return undefined; // Return undefined for null/undefined input
  }

  if (Array.isArray(input)) {
    // Ensure all elements are strings, filter out non-strings if necessary
    const stringArray = input.filter(item => typeof item === 'string');
    return stringArray.length > 0 ? stringArray : undefined;
  }

  if (typeof input === 'string') {
    // Trim whitespace from the string
    const trimmedInput = input.trim();
    
    // If empty string after trimming, return undefined
    if (trimmedInput === '') {
        return undefined;
    }

    // Try to parse as JSON array
    if (trimmedInput.startsWith('[') && trimmedInput.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmedInput);
        if (Array.isArray(parsed)) {
          // Ensure all elements are strings
          const stringArray = parsed.filter(item => typeof item === 'string');
          return stringArray.length > 0 ? stringArray : undefined;
        }
      } catch { 
        console.warn(`safeJsonArray: Failed to parse potential JSON array string: ${trimmedInput}. Treating as single string.`);
      }
    }
    
    // If not a JSON array string (or parsing failed), treat as a single string element
    return [trimmedInput]; 
  }

  // If input is not a string, array, null, or undefined, return undefined
  console.warn(`safeJsonArray: Received unexpected input type: ${typeof input}`);
  return undefined;
}
