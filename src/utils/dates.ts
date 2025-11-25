// Utils for UTC streak logic
export function getUTCMidnight(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function isSameUTCDay(a: Date, b: Date) {
  return getUTCMidnight(a).getTime() === getUTCMidnight(b).getTime();
}

export function isYesterdayUTCDay(last: Date, today: Date) {
  const yesterday = getUTCMidnight(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return getUTCMidnight(last).getTime() === yesterday.getTime();
}