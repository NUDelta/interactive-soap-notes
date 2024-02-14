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
    second: includeSeconds ? 'numeric' : undefined,
    timeZone: timezone,
  });
};

/**
 * Short-form date formatter that includes only the day of the week, year, month, and day.
 * @param date JavaScript date object.
 * @returns string formatted date.
 */
export const shortDate = (date: Date) => {
  return date.toLocaleDateString('en-us', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
