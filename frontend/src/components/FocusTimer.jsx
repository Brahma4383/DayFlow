import { Pause, Play, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatSeconds } from '../utils/format'
import Button from './Button'
import ProgressRing from './ProgressRing'

/**
 * Countdown ring for a focus session with Pause/Resume and Stop.
 * Calls onFinish once when it reaches 00:00 and onStop when Stop is clicked.
 * Pausing only stops this timer; the server is not told.
 * Test ids: "focus-timer", "focus-task-title", "focus-time", "focus-progress", "focus-paused",
 * "focus-pause-button", "focus-stop-button".
 */
export default function FocusTimer({ taskTitle, durationMinutes, remainingSeconds, onFinish, onStop }) {
  const totalSeconds = durationMinutes * 60
  const [secondsLeft, setSecondsLeft] = useState(remainingSeconds)
  const [paused, setPaused] = useState(false)
  const remainingRef = useRef(remainingSeconds) // time left when the timer was last started or paused
  const finishedRef = useRef(false)

  // While running, count down to a fixed end time. Counting ticks would drift when the tab is in the background.
  useEffect(() => {
    if (paused) return
    const endTime = Date.now() + remainingRef.current * 1000
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      remainingRef.current = left
      setSecondsLeft(left)
    }, 250)
    return () => clearInterval(timer)
  }, [paused])

  useEffect(() => {
    if (secondsLeft === 0 && !finishedRef.current) {
      finishedRef.current = true
      onFinish()
    }
  }, [secondsLeft, onFinish])

  const elapsedPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0

  return (
    <div id="focus-timer" className={`focus-timer${paused ? ' is-paused' : ''}`}>
      <p className="eyebrow">Focusing on</p>
      <p id="focus-task-title" className="focus-task-title">
        {taskTitle}
      </p>

      <ProgressRing
        id="focus-progress"
        className="focus-ring"
        label="Focus session progress"
        value={elapsedPercent}
        size={280}
        stroke={16}
        tone={paused ? 'warning' : 'primary'}
      >
        <span id="focus-time" className="focus-time">
          {formatSeconds(secondsLeft)}
        </span>
        <span className="focus-ring-caption">
          {paused ? (
            <span id="focus-paused" className="focus-paused">
              Paused
            </span>
          ) : (
            `of ${durationMinutes} min`
          )}
        </span>
      </ProgressRing>

      <div className="focus-actions">
        <Button
          id="focus-pause-button"
          variant="secondary"
          onClick={() => setPaused(!paused)}
          disabled={secondsLeft === 0}
        >
          {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          {paused ? 'Resume' : 'Pause'}
        </Button>
        <Button id="focus-stop-button" variant="danger" onClick={onStop}>
          <Square size={15} aria-hidden="true" />
          Stop
        </Button>
      </div>
    </div>
  )
}
