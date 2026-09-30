import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Search box that waits until the user stops typing (default 400 ms) before calling onSearch,
 * so the API is not called on every key press. Pass a stable onSearch (e.g. a state setter).
 */
export default function SearchBar({ id = 'search', value = '', onSearch, placeholder = 'Search...', delay = 400 }) {
  const [text, setText] = useState(value)

  useEffect(() => {
    if (text.trim() === value) return
    const timer = setTimeout(() => onSearch(text.trim()), delay)
    return () => clearTimeout(timer)
  }, [text, value, delay, onSearch])

  return (
    <div className="search-bar">
      <Search size={16} className="search-bar-icon" aria-hidden="true" />
      <input
        id={id}
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
    </div>
  )
}
