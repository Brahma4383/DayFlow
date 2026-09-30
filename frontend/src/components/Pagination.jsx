import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

// Previous / "Page 2 of 5" / Next. Hidden when everything fits on one page.
export default function Pagination({ page, pageSize, count, onPageChange }) {
  const totalPages = Math.ceil(count / pageSize)
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="Pages">
      <Button
        id="pagination-prev"
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Previous
      </Button>
      <span id="pagination-info">
        Page {page} of {totalPages}
      </span>
      <Button
        id="pagination-next"
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight size={16} aria-hidden="true" />
      </Button>
    </nav>
  )
}
