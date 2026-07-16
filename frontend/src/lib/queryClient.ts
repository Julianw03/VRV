import { QueryClient } from '@tanstack/react-query'

/**
 * Exported as a singleton (rather than constructed inline in `main.tsx`) so
 * non-React modules can read/write the cache directly — e.g. syncing WS-pushed
 * Zustand state into a query's cache without needing a React hook or a mount point.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
})
