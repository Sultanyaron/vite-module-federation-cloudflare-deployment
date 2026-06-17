// Async import boundary — same Module Federation requirement as the host:
// shared singletons must initialize before the app entry is evaluated.
import('./bootstrap')
