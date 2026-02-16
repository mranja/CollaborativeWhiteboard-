import React from 'react'
import useBoardStore from '../store/useBoardStore'

export default function Toolbar({ userRole = 'editor', onVersionClick }){
  const currentTool = useBoardStore(s => s.currentTool)
  const setCurrentTool = useBoardStore(s => s.setCurrentTool)
  const isViewer = userRole === 'viewer'

  const tools = [
    { id: 'select', label: 'Select', color: 'bg-blue-600' },
    { id: 'rectangle', label: 'Rectangle', color: 'bg-green-600' },
    { id: 'circle', label: 'Circle', color: 'bg-purple-600' },
    { id: 'line', label: 'Line', color: 'bg-yellow-500' },
    { id: 'sticky', label: 'Sticky Note', color: 'bg-orange-500' },
    { id: 'text', label: 'Text', color: 'bg-gray-600' }
  ]

  return (
    <div className="space-y-2">
      {isViewer && (
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded text-sm font-medium">
          Viewer Mode (Read-only)
        </div>
      )}
      
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => !isViewer && setCurrentTool(tool.id)}
          disabled={isViewer}
          className={`
            w-full py-2 px-3 rounded text-white font-medium transition
            ${currentTool === tool.id ? 'ring-2 ring-offset-2' : ''}
            ${isViewer ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}
            ${tool.color}
          `}
        >
          {tool.label}
        </button>
      ))}

      <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-3">
        <button
          onClick={onVersionClick}
          className="w-full py-2 px-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm font-medium"
        >
          Version History
        </button>
      </div>
    </div>
  )
}
