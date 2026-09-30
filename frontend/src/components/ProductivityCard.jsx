import { Gauge } from 'lucide-react'
import Panel from './Panel'
import ProgressBar from './ProgressBar'
import ProgressRing from './ProgressRing'

function scoreMessage(score) {
  if (score >= 80) return 'Excellent day. Keep it going!'
  if (score >= 60) return 'Good progress so far.'
  if (score >= 30) return 'A few more wins will lift it.'
  return 'Tick off a task or habit to get started.'
}

/**
 * Today's productivity score as a ring, and the three parts it is made of.
 * productivity: { task_completion, habit_completion, focus_score, productivity_score }
 * Test ids: "productivity-card", "productivity-score", "productivity-tasks", "productivity-habits", "productivity-focus".
 */
export default function ProductivityCard({ productivity, title = "Today's score" }) {
  const { task_completion, habit_completion, focus_score, productivity_score } = productivity

  return (
    <Panel id="productivity-card" title={title} icon={Gauge} tone="pink" className="productivity-card">
      <div className="productivity-summary">
        <ProgressRing value={productivity_score} size={132} stroke={12}>
          <span id="productivity-score" className="ring-value">
            {productivity_score}
          </span>
          <span className="ring-caption">of 100</span>
        </ProgressRing>
        <p className="productivity-message">{scoreMessage(productivity_score)}</p>
      </div>
      <div className="productivity-parts">
        <ProgressBar id="productivity-tasks" label="Tasks (50%)" value={task_completion} />
        <ProgressBar id="productivity-habits" label="Habits (30%)" value={habit_completion} variant="success" />
        <ProgressBar id="productivity-focus" label="Focus (20%)" value={focus_score} variant="warning" />
      </div>
    </Panel>
  )
}
