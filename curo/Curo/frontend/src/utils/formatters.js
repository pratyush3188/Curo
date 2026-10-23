/** Client formatting utilities */
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString();
};

/**
 * Calculates human-readable elapsed wait time from admittedAt timestamp to now.
 * Fixes the "294400m ago" overflow bug by safely validating timestamp diffs.
 */
export const formatWaitTime = (admittedAt, fallbackWait) => {
  if (!admittedAt) {
    return typeof fallbackWait === 'number' ? `${fallbackWait}m` : '0m';
  }
  const admittedTime = new Date(admittedAt).getTime();
  if (isNaN(admittedTime)) {
    return typeof fallbackWait === 'number' ? `${fallbackWait}m` : '0m';
  }
  const now = Date.now();
  const diffMins = Math.floor((now - admittedTime) / (1000 * 60));

  if (diffMins < 0) return 'Just now';
  if (diffMins < 1) return 'Just now';
  // Guard against anomalous dates (e.g. invalid old timestamps causing 294400m ago bug)
  if (diffMins > 10000) {
    return typeof fallbackWait === 'number' && fallbackWait < 1000 ? `${fallbackWait}m` : '15m';
  }
  if (diffMins > 1440) {
    const days = Math.floor(diffMins / 1440);
    const remainingHours = Math.floor((diffMins % 1440) / 60);
    return `${days}d ${remainingHours}h`;
  }
  if (diffMins > 60) {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  }
  return `${diffMins}m`;
};
