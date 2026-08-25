import React from 'react'

/**
 * Flowboard Loader
 *
 * The wind strokes from the Flowboard logo, with air streaming through them
 * from left to right. No container — just the strokes.
 *
 * The three strokes are the Feather "wind" subpaths reversed so each runs
 * left-to-right, which lets a single dash pattern slide in the direction the
 * air reads as moving. `pathLength="100"` normalises them so all three stay in
 * step despite their real lengths differing, and the animation (see index.css)
 * shifts the offset by exactly one dash period so the loop is seamless.
 *
 * Props:
 *   size   'xs' | 'sm' | 'md' | 'lg'   visual scale (default 'md')
 *   inline true renders monochrome at text scale, for use inside buttons
 *   theme  'light' | 'dark'            controls stroke and label colours
 *   label  optional primary text under the mark
 *   sub    optional secondary text under the label
 */

const SIZES = {
  xs: { icon: 18, stroke: 2.4 },
  sm: { icon: 44, stroke: 2.1 },
  md: { icon: 68, stroke: 1.9 },
  lg: { icon: 96, stroke: 1.7 },
}

// Gust accent: indigo on light surfaces, a lighter indigo on dark ones.
const GUST = { light: '#4f46e5', dark: '#a5b4fc' }

function WindGusts({ size, strokeWidth }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      focusable="false"
    >
      {/* Each subpath starts at the left edge (x=2) and runs right into its
          curl. The base layer keeps the mark readable; the gust layer is the
          air travelling along it, all three strokes in step. */}
      <path className="fb-loader__gust-base" d="M2 8 H11 A2 2 0 1 0 9.59 4.59" />
      <path className="fb-loader__gust-base" d="M2 12 H19.5 A2.5 2.5 0 1 0 17.73 7.73" />
      <path className="fb-loader__gust-base" d="M2 16 H14 A2 2 0 1 1 12.59 19.41" />

      <path className="fb-loader__gust" pathLength="100" d="M2 8 H11 A2 2 0 1 0 9.59 4.59" />
      <path className="fb-loader__gust" pathLength="100" d="M2 12 H19.5 A2.5 2.5 0 1 0 17.73 7.73" />
      <path className="fb-loader__gust" pathLength="100" d="M2 16 H14 A2 2 0 1 1 12.59 19.41" />
    </svg>
  )
}

export default function Loader({
  size = 'md',
  inline = false,
  theme = 'light',
  label = '',
  sub = '',
  className = '',
}) {
  const dims = SIZES[size] || SIZES.md
  const isDark = theme === 'dark'

  if (inline) {
    // Inside a button the mark inherits the button's text colour, so the gust
    // stays monochrome rather than fighting the button's own palette.
    return (
      <span
        className={`fb-loader ${className}`}
        style={{ width: dims.icon, height: dims.icon }}
        role="status"
        aria-label={label || 'Loading'}
      >
        <WindGusts size={dims.icon} strokeWidth={dims.stroke} />
      </span>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading'}
    >
      <span
        className={`fb-loader ${isDark ? 'text-slate-200' : 'text-slate-900'}`}
        style={{ '--fb-gust': isDark ? GUST.dark : GUST.light }}
      >
        <WindGusts size={dims.icon} strokeWidth={dims.stroke} />
      </span>

      {(label || sub) && (
        <div className="mt-6 flex flex-col items-center text-center">
          {label && (
            <h3
              className={`text-lg font-black tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {label}
            </h3>
          )}
          {sub && (
            <p
              className={`mt-1 text-sm font-medium ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {sub}
            </p>
          )}
          <span
            className={`fb-loader__stream mt-4 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}
