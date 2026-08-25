import { boardAPI } from '../api/client'

/**
 * Board-list cache.
 *
 * The dashboard renders from this cache immediately and revalidates in the
 * background. Two things previously caused a visible lag after joining or
 * leaving a room:
 *
 *   1. Joining a board auto-attaches you as a collaborator server-side, so the
 *      cached member count was stale until the dashboard's own fetch landed.
 *   2. The dashboard only started its fetch once it mounted, so the whole
 *      round-trip happened after the user was already looking at the page.
 *
 * The board page now patches the cache with what it already knows and kicks off
 * a prefetch on the way out, and every caller shares one in-flight request, so
 * the dashboard paints correct data on its first frame.
 */

const CACHE_KEY = 'flowboard_cached_boards'

let inflight = null
let lastFetchedAt = 0
const subscribers = new Set()

// Focus and visibilitychange both fire when a tab is re-entered, and users
// alt-tab a lot. Anything newer than this is treated as fresh enough.
const FRESH_FOR_MS = 5000

const notify = (list) => {
  subscribers.forEach((fn) => {
    try {
      fn(list)
    } catch (e) {
      console.error('Boards cache subscriber error:', e)
    }
  })
}

export function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

export function writeCache(list) {
  const safe = Array.isArray(list) ? list : []
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(safe))
  } catch (e) {
    // Quota or private-mode failures must not break rendering.
  }
  notify(safe)
  return safe
}

export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (e) {
    // ignore
  }
  inflight = null
  lastFetchedAt = 0
  notify([])
}

/** Subscribe to cache writes. Returns an unsubscribe function. */
export function subscribe(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/**
 * Merge a single board's freshly-known fields into the cached list so the
 * dashboard's first paint is already correct.
 */
export function patchBoard(board) {
  if (!board || !board._id) return readCache()
  const id = String(board._id)
  const list = readCache()
  const index = list.findIndex((b) => String(b._id) === id)

  if (index === -1) {
    return writeCache([board, ...list])
  }

  const merged = [...list]
  merged[index] = { ...merged[index], ...board }
  return writeCache(merged)
}

export function removeBoard(boardId) {
  const id = String(boardId)
  return writeCache(readCache().filter((b) => String(b._id) !== id))
}

/**
 * Fetch the board list. Concurrent callers share a single request, so a
 * prefetch started while leaving a board is reused by the dashboard instead of
 * triggering a second round-trip.
 */
export function fetchBoards() {
  if (inflight) return inflight

  inflight = boardAPI
    .listBoards()
    .then((res) => {
      lastFetchedAt = Date.now()
      return writeCache(res.data || [])
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/**
 * Refresh unless we already have a response from the last few seconds. Used by
 * the focus/visibility listeners so re-entering the tab repeatedly does not
 * fire a request every time.
 */
export function revalidateBoards() {
  if (Date.now() - lastFetchedAt < FRESH_FOR_MS) {
    return Promise.resolve(readCache())
  }
  return fetchBoards()
}

/** Fire-and-forget revalidation; errors are intentionally swallowed. */
export function prefetchBoards() {
  fetchBoards().catch(() => {})
}

export function hasInflightFetch() {
  return inflight !== null
}
