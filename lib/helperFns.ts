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
 * Formats an ISO date string to short form without timezone conversion.
 * Extracts the date portion directly to avoid UTC-to-local timezone shifts.
 * @param isoString ISO date string (e.g., "2026-04-07T00:00:00.000Z")
 * @returns string formatted date (e.g., "Mon, Apr 7, 2026")
 */
export const shortDateFromISO = (isoString: string): string => {
  // Extract YYYY-MM-DD from ISO string
  const [year, month, day] = isoString.split('T')[0].split('-').map(Number);
  const date = new Date(year, month - 1, day); // Use local timezone
  return date.toLocaleDateString('en-us', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formats an ISO date string to long form without timezone conversion.
 * Extracts the date portion directly to avoid UTC-to-local timezone shifts.
 * @param isoString ISO date string (e.g., "2026-04-07T10:30:00.000Z")
 * @param includeSeconds whether to include seconds
 * @returns string formatted date
 */
export const longDateFromISO = (isoString: string, includeSeconds: boolean = false): string => {
  // Extract date and time from ISO string
  const [datePart, timePart] = isoString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, secondsStr] = timePart.split(':');
  const seconds = parseInt(secondsStr);
  
  const date = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes), seconds);
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

/**
 * Helper function to shorten text to a maximum length.
 * @param text string to shorten.
 * @param maxLength maximum length of the string.
 * @returns string shortened text if longer than maxLength, else the original text.
 */
export const shortenText = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};
