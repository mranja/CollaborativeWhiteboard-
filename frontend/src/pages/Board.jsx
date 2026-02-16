import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CanvasBoard from '../components/CanvasBoard'
import Toolbar from '../components/Toolbar'
import CollaboratorsList from '../components/CollaboratorsList'
import InviteModal from '../components/InviteModal'
import VersionHistoryModal from '../components/VersionHistoryModal'
import useBoardStore from '../store/useBoardStore'
import useAuthStore from '../store/useAuthStore'
import { boardAPI } from '../api/client'

export default function BoardPage(){
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const setBoard = useBoardStore(s => s.setBoard)
  const [socket, setSocket] = useState(null)
  const [userRole, setUserRole] = useState('editor')
  const [showInvite, setShowInvite] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [boardTitle, setBoardTitle] = useState('Untitled')

  useEffect(() => {
    setBoard(id)
    
    // Fetch board info to determine user role
    const fetchBoard = async () => {
      try {
        const res = await boardAPI.getBoard(id)
        setBoardTitle(res.data.title)
        
        // Determine user role
        if (res.data.owner._id === user?.id) {
          setUserRole('owner')
        } else {
          const collab = res.data.collaborators?.find(c => c.user._id === user?.id)
          setUserRole(collab?.role || 'viewer')
        }
      } catch (err) {
        console.error('Failed to fetch board:', err)
      }
    }
    
    fetchBoard()
  }, [id, user])

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow">
        <div>
          <h1 className="text-2xl font-bold">{boardTitle}</h1>
          <p className="text-sm text-gray-500">Role: {userRole}</p>
        </div>
        <div className="flex gap-2">
          {userRole === 'owner' && (
            <button
              onClick={() => setShowInvite(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Invite
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Back
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 p-4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <Toolbar userRole={userRole} onVersionClick={() => setShowVersionHistory(true)} />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <CanvasBoard boardId={id} userRole={userRole} onSocketChange={setSocket} />
        </div>
        
        <div className="w-56 p-4 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          {socket && <CollaboratorsList boardId={id} socket={socket} />}
        </div>
      </div>

      {showInvite && <InviteModal boardId={id} onClose={() => setShowInvite(false)} />}
      {showVersionHistory && <VersionHistoryModal boardId={id} onClose={() => setShowVersionHistory(false)} />}
    </div>
  )
}
