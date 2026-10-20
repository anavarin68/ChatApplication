
export function timeAgo(date) {
  const now = new Date();
  const past = new Date(date);

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