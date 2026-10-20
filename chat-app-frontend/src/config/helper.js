
function parseServerDate(date) {
  if (typeof date !== "string") {
    return new Date(date);
  }

  // LocalDateTime values from the backend are generated in Render's UTC timezone.
  // Treat timezone-less ISO values as UTC instead of the browser's local timezone.
  const hasTimezone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(date);
  return new Date(hasTimezone ? date : `${date}Z`);
}

export function formatMessageTime(date, hour12 = false) {
  const parsedDate = parseServerDate(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid time";
  }

  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
    hour12,
  }).format(parsedDate);
}

export function getMessageDateKey(date) {
  const parsedDate = parseServerDate(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsedDate);
}

export function formatMessageDateLabel(date) {
  const parsedDate = parseServerDate(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  const today = new Date();
  const todayKey = getMessageDateKey(today);
  const dateKey = getMessageDateKey(parsedDate);
  if (dateKey === todayKey) return "Today";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === getMessageDateKey(yesterday)) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(parsedDate);
}

export function timeAgo(date) {
  const now = new Date();
  const past = parseServerDate(date);

  if (Number.isNaN(past.getTime())) {
    return "Invalid date";
  }

  const secondsAgo = Math.floor((now - past) / 1000);

  if (secondsAgo < 0) return "just now";
  if (secondsAgo < 10) return "just now";
  if (secondsAgo < 60) return `${secondsAgo} seconds ago`;

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return `${minutesAgo} minute${minutesAgo !== 1 ? "s" : ""} ago`;
  }

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `${hoursAgo} hour${hoursAgo !== 1 ? "s" : ""} ago`;
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 30) {
    return `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
  }

  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo < 12) {
    return `${monthsAgo} month${monthsAgo !== 1 ? "s" : ""} ago`;
  }

  const yearsAgo = Math.floor(daysAgo / 365);
  return `${yearsAgo} year${yearsAgo !== 1 ? "s" : ""} ago`;
}

export default timeAgo;