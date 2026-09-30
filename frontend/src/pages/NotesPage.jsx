import { Pin, Plus, StickyNote, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Button from '../components/Button'
import ConfirmationModal from '../components/ConfirmationModal'
import EmptyState from '../components/EmptyState'
import FilterDropdown from '../components/FilterDropdown'
import Input from '../components/Input'
import LoadError from '../components/LoadError'
import LoadingSpinner from '../components/LoadingSpinner'
import NoteCard from '../components/NoteCard'
import NoteFormModal from '../components/NoteFormModal'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import { useToast } from '../context/useToast'
import { getErrorMessage, isNotFound } from '../services/errors'
import { deleteNote, getNotes, NOTES_PAGE_SIZE, updateNote } from '../services/noteService'
import { NOTE_COLORS, NOTE_SORT_OPTIONS, noteName } from '../utils/notes'

const NO_FILTERS = { search: '', color: '' }
const COLOR_FILTER_OPTIONS = NOTE_COLORS.map((color) => ({ ...color, label: color.value === 'default' ? 'No colour' : color.label }))

export default function NotesPage() {
  const showToast = useToast()
  const [filters, setFilters] = useState(NO_FILTERS)
  const [ordering, setOrdering] = useState('-updated_at')
  const [page, setPage] = useState(1)
  const [notePage, setNotePage] = useState(null) // { count, results } from the API
  const [loadError, setLoadError] = useState('') // friendly message when loading failed
  const [reloadCount, setReloadCount] = useState(0)
  const [busyNoteId, setBusyNoteId] = useState(null)
  const [noteForm, setNoteForm] = useState(null) // null = closed, { note: null } = add, { note } = edit
  const [deletingNote, setDeletingNote] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [searchBoxKey, setSearchBoxKey] = useState(0) // changing it empties the search box

  // Load the current page whenever the filters, sort order, page or reloadCount change
  useEffect(() => {
    let ignore = false // skip results that arrive after leaving the page
    const params = { page, page_size: NOTES_PAGE_SIZE, ordering }
    if (filters.search) params.search = filters.search
    if (filters.color) params.color = filters.color
    getNotes(params)
      .then((data) => {
        if (ignore) return
        setNotePage(data)
        setLoadError('')
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error))
      })
    return () => {
      ignore = true
    }
  }, [filters, ordering, page, reloadCount])

  const reload = () => setReloadCount((count) => count + 1)

  const handleSearch = useCallback((search) => {
    setFilters((current) => ({ ...current, search }))
    setPage(1)
  }, [])

  function handleColorFilter(color) {
    setFilters({ ...filters, color })
    setPage(1)
  }

  function clearFilters() {
    setFilters(NO_FILTERS)
    setPage(1)
    setSearchBoxKey((key) => key + 1)
  }

  async function handleTogglePin(note) {
    const pinned = !note.pinned
    setBusyNoteId(note.id)
    try {
      await updateNote(note.id, { pinned })
      showToast(pinned ? 'Note pinned to the top.' : 'Note unpinned.')
      reload() // pinned notes move to the top
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      if (isNotFound(error)) reload() // deleted somewhere else: refresh the list
    } finally {
      setBusyNoteId(null)
    }
  }

  function handleSaved() {
    const isEdit = Boolean(noteForm.note)
    setNoteForm(null)
    showToast(isEdit ? 'Note saved.' : 'Note added.')
    if (!isEdit && page !== 1) {
      setPage(1) // new notes are listed first
    } else {
      reload()
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      await deleteNote(deletingNote.id)
      showToast('Note deleted.')
      setDeletingNote(null)
      // Deleted the only note on the last page: go back one page
      if (notePage.results.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        reload()
      }
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      if (isNotFound(error)) {
        setDeletingNote(null) // already gone: close the question and refresh the list
        reload()
      }
    } finally {
      setDeleting(false)
    }
  }

  function handleRetry() {
    setLoadError('')
    reload()
  }

  const openAddForm = () => setNoteForm({ note: null })
  const hasFilters = Boolean(filters.search || filters.color)
  const cardHandlers = {
    onOpen: (note) => setNoteForm({ note }),
    onEdit: (note) => setNoteForm({ note }),
    onTogglePin: handleTogglePin,
    onDelete: setDeletingNote,
  }

  let content
  if (loadError) {
    content = <LoadError id="notes-error" retryId="notes-retry" what="your notes" message={loadError} onRetry={handleRetry} />
  } else if (notePage === null) {
    content = <LoadingSpinner id="notes-loading" className="page-loading" />
  } else if (notePage.count === 0 && hasFilters) {
    content = (
      <EmptyState id="notes-empty" title="No matching notes" text="No notes match your search or filter.">
        <Button id="clear-filters" variant="secondary" onClick={clearFilters}>
          Clear filters
        </Button>
      </EmptyState>
    )
  } else if (notePage.count === 0) {
    content = (
      <EmptyState id="notes-empty" icon={StickyNote} title="No notes yet" text="Keep ideas, lists and reminders here.">
        <Button id="add-first-note" onClick={openAddForm}>
          <Plus size={17} aria-hidden="true" />
          New Note
        </Button>
      </EmptyState>
    )
  } else {
    // Pinned notes come first from the API; show them under their own heading on the first page
    const pinned = notePage.results.filter((note) => note.pinned)
    const others = notePage.results.filter((note) => !note.pinned)
    content = (
      <>
        <p id="note-count" className="list-count">
          {notePage.count} {notePage.count === 1 ? 'note' : 'notes'}
        </p>
        {pinned.length > 0 && (
          <section className="note-section" aria-labelledby="pinned-notes-title">
            <h2 id="pinned-notes-title" className="note-section-title">
              <Pin size={15} aria-hidden="true" />
              Pinned
            </h2>
            <div id="pinned-notes" className="note-grid">
              {pinned.map((note) => (
                <NoteCard key={note.id} note={note} busy={busyNoteId === note.id} {...cardHandlers} />
              ))}
            </div>
          </section>
        )}
        {others.length > 0 && (
          <section className="note-section" aria-labelledby="other-notes-title">
            {pinned.length > 0 && (
              <h2 id="other-notes-title" className="note-section-title">
                Others
              </h2>
            )}
            <div id="note-list" className="note-grid">
              {others.map((note) => (
                <NoteCard key={note.id} note={note} busy={busyNoteId === note.id} {...cardHandlers} />
              ))}
            </div>
          </section>
        )}
        <Pagination page={page} pageSize={NOTES_PAGE_SIZE} count={notePage.count} onPageChange={setPage} />
      </>
    )
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1 id="notes-title">Notes</h1>
          <p className="page-subtitle">Ideas, lists and reminders, all in one place.</p>
        </div>
        <div className="page-actions">
          <Button id="add-note-button" onClick={openAddForm}>
            <Plus size={17} aria-hidden="true" />
            New Note
          </Button>
        </div>
      </div>

      <div className="card toolbar">
        <SearchBar key={searchBoxKey} id="note-search" value={filters.search} onSearch={handleSearch} placeholder="Search notes..." />
        <FilterDropdown
          id="filter-color"
          label="Colour"
          value={filters.color}
          options={COLOR_FILTER_OPTIONS}
          onChange={handleColorFilter}
          allLabel="All colours"
        />
        <Input
          id="note-sort"
          label="Sort by"
          className="filter-dropdown"
          options={NOTE_SORT_OPTIONS}
          value={ordering}
          onChange={(event) => {
            setOrdering(event.target.value)
            setPage(1)
          }}
        />
        {hasFilters && (
          <Button id="toolbar-clear" variant="ghost" size="sm" className="toolbar-clear" onClick={clearFilters}>
            <X size={15} aria-hidden="true" />
            Clear
          </Button>
        )}
      </div>

      {content}

      {noteForm && <NoteFormModal note={noteForm.note} onClose={() => setNoteForm(null)} onSaved={handleSaved} />}

      <ConfirmationModal
        open={Boolean(deletingNote)}
        title="Delete note?"
        message={deletingNote ? `Delete "${noteName(deletingNote)}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingNote(null)}
      />
    </section>
  )
}
