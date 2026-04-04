export function trackToolActivity(toolId, action) {
  if (!toolId || !action || typeof window === 'undefined') {
    return
  }

  fetch('/api/activity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ toolId, action }),
    keepalive: true,
  }).catch(() => {})
}
