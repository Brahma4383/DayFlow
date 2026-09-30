// Colours a note can have. The value is what the API stores; the label is shown to the user.
export const NOTE_COLORS = [
  { value: 'default', label: 'No colour' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'orange', label: 'Orange' },
]

export const NOTE_SORT_OPTIONS = [
  { value: '-updated_at', label: 'Last edited' },
  { value: '-created_at', label: 'Newest first' },
  { value: 'created_at', label: 'Oldest first' },
  { value: 'title', label: 'Title A–Z' },
]

// What a note is called in messages: its title, or the start of its text
export function noteName(note) {
  const title = note.title.trim()
  if (title) return title
  const firstLine = note.content.trim().split('\n')[0]
  return firstLine.length > 40 ? `${firstLine.slice(0, 40).trimEnd()}…` : firstLine
}
