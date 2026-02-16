import React from 'react'
import { useBoardStore } from '../../stores/boardStore'
import ToolButton from '../ui/ToolButton'
import { AiOutlineSelect, AiOutlineEdit, AiOutlineHighlight, AiOutlineBorder, AiOutlineLine, AiOutlineFontSize } from 'react-icons/ai'

const tools = [
  { id: 'select', label: 'Select (V)', icon: <AiOutlineSelect /> },
  { id: 'pen', label: 'Pen (P)', icon: <AiOutlineEdit /> },
  { id: 'eraser', label: 'Eraser (E)', icon: <AiOutlineHighlight /> },
  { id: 'rect', label: 'Rectangle (R)', icon: <AiOutlineBorder /> },
  { id: 'line', label: 'Line (L)', icon: <AiOutlineLine /> },
  { id: 'text', label: 'Text (T)', icon: <AiOutlineFontSize /> }
]

export default function SidebarToolbar() {
  const { tool, setTool } = useBoardStore((s) => ({ tool: s.tool, setTool: s.setTool }))

  return (
    <aside className="fixed left-6 top-20 bottom-6 w-20 bg-[rgba(255,255,255,0.03)] backdrop-blur-xs rounded-2xl tool-shadow p-3 flex flex-col gap-3 z-40">
      {tools.map((t) => (
        <ToolButton key={t.id} active={tool === t.id} onClick={() => setTool(t.id)} label={t.label}>
          {t.icon}
        </ToolButton>
      ))}
    </aside>
  )
}
