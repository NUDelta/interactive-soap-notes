/**
 * Formats a date object into a human readable string.
 * @param date JavaScript date object.
 * @param includeSeconds boolean whether to include seconds in the formatted date. Defaults to false.
 * @param timezone string timezone to format the date in. Defaults to 'America/Chicago'.
 * @returns string formatted date.
 */
export const longDate = (
  date: Date,
  includeSeconds: boolean = false,
  timezone: string = 'America/Chicago'
) => {
  return date.toLocaleDateString('en-us', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: includeSeconds ? 'numeric' : undefined
  });
};

/**
 * Short-form date formatter that includes only the day of the week, year, month, and day.
 * @param date JavaScript date object.
 * @returns string formatted date.
 */
export const shortDate = (date: Date, timezone: string = 'America/Chicago') => {
  return date.toLocaleDateString('en-us', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Helper function to serialize dates in an object.
 * @param object object that has date fields to serialize.
 * @returns
 */
export const serializeDates = (object) => {
  return {
    ...object,
    date:
      typeof object.date === 'string' ? object.date : object.date.toISOString(),
    lastUpdated:
      typeof object.lastUpdated === 'string'
        ? object.lastUpdated
        : object.lastUpdated.toISOString()
  };
};

/**
 * Helper function to escape HTML characters in a string.
 * From: https://stackoverflow.com/a/6234804
 * @param unsafe string to escape HTML characters in.
 * @returns string with HTML characters escaped.
 */
export const textToHtml = (unsafe) => {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

/**
 * Helper function to convert HTML to plain text.
 * @param html string to convert to plain text.
 * @returns string plain text.
 */
export const htmlToText = (html) => {
  // replace html entities with their character and tags
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/<[^>]*>/g, '');
};
