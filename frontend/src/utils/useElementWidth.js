import { useCallback, useState } from 'react'

// [ref, width]: the current pixel width of the element the ref is attached to (charts draw at this size)
export function useElementWidth() {
  const [width, setWidth] = useState(0)
  const ref = useCallback((element) => {
    if (!element) return
    setWidth(element.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}
