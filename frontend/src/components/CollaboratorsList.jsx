import React, { useEffect, useState } from 'react'
import useBoardStore from '../store/useBoardStore'

export default function CollaboratorsList({ boardId, socket }) {
  const [collaborators, setCollaborators] = useState([])

  useEffect(() => {
    // Listen for user join/leave events
    if (!socket) return

    const handleUserJoined = (data) => {
      setCollaborators((prev) => {
        const exists = prev.some((c) => c.id === data.userId)
        if (!exists) {
          return [...prev, { id: data.userId, name: data.name, online: true }]
        }
        return prev
      })
    }

    const handleUserLeft = (data) => {
      setCollaborators((prev) => prev.filter((c) => c.id !== data.userId))
    }

    socket.on('user-joined', handleUserJoined)
    socket.on('user-left', handleUserLeft)

    return () => {
      socket.off('user-joined', handleUserJoined)
      socket.off('user-left', handleUserLeft)
    }
  }, [socket])

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-lg mb-3 px-2">Active Users</h3>
      <div className="space-y-2 flex-1 overflow-auto px-2">
        {collaborators.length === 0 ? (
          <p className="text-sm text-gray-500">No users connected</p>
        ) : (
          collaborators.map((collab) => (
            <div key={collab.id} className="flex items-center gap-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm">{collab.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
