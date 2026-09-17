/**
 * A scrolling ECG trace.
 *
 * The waveform is a real PQRST complex rather than a decorative zigzag: a small
 * P bump, the sharp QRS spike, then the broader T wave. Anyone who has seen a
 * monitor reads it instantly, and getting it wrong looks wrong.
 *
 * Two copies of the same 400-unit run sit side by side and the pair translates
 * left by exactly 400, so the loop is seamless.
 */

/** One beat, 100 units wide, baseline at y=25 in a 50-unit-tall box. */
function beat(offset: number): string {
  const p: [number, number][] = [
    [0, 25],
    [20, 25], // flat
    [24, 19], // P wave up
    [28, 25],
    [36, 25], // flat
    [38, 29], // Q dip
    [42, 5], //  R spike
    [46, 38], // S trough
    [50, 25], // back to baseline
    [60, 25],
    [66, 17], // T wave
    [72, 25],
    [100, 25], // flat to the next beat
  ]
  return p.map(([x, y]) => `${x + offset},${y}`).join(' ')
}

const RUN = [0, 100, 200, 300].map(beat).join(' ')

type Props = {
  className?: string
  /** Seconds for one full 400-unit pass. Lower is faster. */
  speed?: number
  /** Stroke width in SVG units. */
  weight?: number
  /** Screen-reader label. Decorative by default. */
  label?: string
}

export function Heartbeat({ className = '', speed = 7, weight = 2, label }: Props) {
  return (
    <svg
      className={`ecg-mask ${className}`}
      viewBox="0 0 400 50"
      preserveAspectRatio="none"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ ['--ecg-speed' as string]: `${speed}s`, ['--ecg-weight' as string]: weight }}
    >
      <g className="ecg-track">
        <polyline className="ecg-line" points={RUN} />
        <polyline className="ecg-line" points={RUN} transform="translate(400,0)" />
      </g>
    </svg>
  )
}
