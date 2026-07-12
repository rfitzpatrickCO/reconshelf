import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { reorderQueue } from '../lib/db'
import BookRow from './BookRow'
import Icon from './Icon'

function SortableItem({ book }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 5 : undefined,
    position: 'relative',
  }
  return (
    <div ref={setNodeRef} style={style} className="rs-queue-item">
      <button className="rs-drag-handle" {...attributes} {...listeners} aria-label="Drag to reorder">
        <Icon name="grip" size={18} />
      </button>
      <BookRow book={book} />
    </div>
  )
}

/*
 * Drag-to-reorder deployment queue. Order is persisted via queue_position.
 * Uses a dedicated grip handle so tapping a row still opens its dossier while
 * dragging the handle reorders (touch-friendly for the iOS PWA).
 */
export default function DeploymentQueue({ books }) {
  const [items, setItems] = useState(books)

  // Re-sync when the set of queued books changes (added/removed), but not on a
  // pure reorder — otherwise an optimistic drag would get reset.
  useEffect(() => {
    const incoming = [...books.map((b) => b.id)].sort().join(',')
    const current = [...items.map((b) => b.id)].sort().join(',')
    if (incoming !== current) setItems(books)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function onDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((b) => b.id === active.id)
    const newIndex = items.findIndex((b) => b.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    reorderQueue(next.map((b) => b.id)).catch(() => {})
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        {items.map((b) => (
          <SortableItem key={b.id} book={b} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
