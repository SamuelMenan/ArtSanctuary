import type { RefObject } from 'react'
import { BoardObject, DEFAULT_FONT } from '@shared/lib/boards/types'

/** Textarea de edición inline posicionada sobre el nodo de texto/nota. */
export default function TextEditor({
  o,
  pos,
  scale,
  editRef,
  onChange,
  onFinish,
}: {
  o: BoardObject
  pos: { x: number; y: number }
  scale: number
  editRef: RefObject<HTMLTextAreaElement | null>
  onChange: (v: string) => void
  onFinish: () => void
}) {
  return (
    <textarea
      ref={editRef}
      value={o.text || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onFinish}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault()
          onFinish()
        }
      }}
      placeholder="Escribe…"
      className="absolute z-20 resize-none outline-none border border-[var(--color-primary)] overflow-hidden"
      style={{
        left: pos.x + o.x * scale,
        top: pos.y + o.y * scale,
        width: o.w * scale,
        minHeight: o.h * scale,
        fontSize: (o.fontSize || 20) * scale,
        fontFamily: o.fontFamily || DEFAULT_FONT,
        fontWeight: o.bold ? 700 : 400,
        fontStyle: o.italic ? 'italic' : 'normal',
        textDecoration: o.underline ? 'underline' : 'none',
        textAlign: o.align || 'left',
        lineHeight: 1.2,
        padding: (o.type === 'sticky' ? 10 : 0) * scale,
        color: o.type === 'sticky' ? o.textColor || '#1f2937' : o.color || '#e8e8e8',
        background: o.type === 'sticky' ? o.color || '#FDE68A' : 'rgba(0,0,0,0.4)',
        transform: o.rotation ? `rotate(${o.rotation}deg)` : undefined,
        transformOrigin: 'top left',
      }}
    />
  )
}
