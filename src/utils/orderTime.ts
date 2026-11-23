// Use the store's business time zone when the API provides it.

const OPTIONS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', { ...OPTIONS, timeZone });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Formats an order timestamp in the store's time zone, falling back to device time. */
export function formatOrderTime(value: string | null | undefined, storeTimeZone?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const zone = storeTimeZone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    return formatterFor(zone).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', OPTIONS).format(date);
  }
}
