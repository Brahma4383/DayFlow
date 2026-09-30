import { Bed, BookOpen, Brain, Code, Droplet, Dumbbell, Footprints, PenLine, Repeat, Salad, Sparkles, Sunrise } from 'lucide-react'

// [words in the habit name, icon, colour]. The first match wins.
const MATCHES = [
  [/water|drink|hydrat/, Droplet, 'blue'],
  [/\bread(ing)?\b|book/, BookOpen, 'orange'],
  [/walk|step|run|jog/, Footprints, 'teal'],
  [/exercise|workout|gym|push|yoga|stretch|sport/, Dumbbell, 'pink'],
  [/meditat|mind|breath|calm/, Sparkles, 'violet'],
  [/journal|write|diary|gratitude/, PenLine, 'orange'],
  [/sleep|bed|nap/, Bed, 'blue'],
  [/wake|morning|early/, Sunrise, 'orange'],
  [/eat|fruit|veg|diet|salad|cook/, Salad, 'teal'],
  [/code|program|develop/, Code, 'violet'],
  [/study|learn|practi|revise|course/, Brain, 'pink'],
]

const FALLBACK_TONES = ['violet', 'teal', 'orange', 'pink', 'blue']

// An icon and colour that suit the habit, e.g. "Drink 8 glasses of water" -> a blue droplet
export function habitIcon(habit) {
  const name = habit.name.toLowerCase()
  const match = MATCHES.find(([words]) => words.test(name))
  if (match) return { Icon: match[1], tone: match[2] }
  return { Icon: Repeat, tone: FALLBACK_TONES[habit.id % FALLBACK_TONES.length] }
}
