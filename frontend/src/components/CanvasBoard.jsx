import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text } from 'react-konva'
import io from 'socket.io-client'
import useBoardStore from '../store/useBoardStore'
import { useThrottledCursorMove } from '../hooks/useThrottledCursorMove'
import LiveCursors from './LiveCursors'
import { getSocketToken } from '../api/client'

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// Array of user colors for cursors
const USER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

export default function CanvasBoard({ boardId, userRole = 'editor', onSocketChange }){
  const stageRef = useRef(null)
  const [socket, setSocket] = useState(null)
  const elements = useBoardStore(s=>s.elements)
  const liveCursors = useBoardStore(s=>s.liveCursors)
  const addElement = useBoardStore(s=>s.addElement)
  const updateLiveCursor = useBoardStore(s=>s.updateLiveCursor)
  const removeLiveCursor = useBoardStore(s=>s.removeLiveCursor)
  const currentUser = useBoardStore(s=>s.currentUser)
  const isViewer = userRole === 'viewer'
  
  // Throttled cursor emit
  const throttledCursorMove = useThrottledCursorMove((x, y) => {
    if (socket) {
      socket.emit('cursor-move', { x, y })
    }
  })

  // Determine user color based on userId
  const getUserColor = (userId) => {
    const hash = userId.charCodeAt(0) + userId.charCodeAt(userId.length - 1)
    return USER_COLORS[hash % USER_COLORS.length]
  }

  useEffect(()=>{
    // Get token from localStorage for socket authentication
    const token = getSocketToken()
    if (!token) {
      console.error('No token available for socket connection')
      return
    }

    const userName = currentUser?.name || 'Guest'
    
    // Connect to socket with JWT token in auth
    const s = io(SOCKET_URL, { 
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    
    setSocket(s);
    onSocketChange?.(s);
    
    s.on('connect', () => {
      console.log('Socket connected')
      s.emit('join-board', { boardId })
    });

    s.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    });
    
    s.on('draw-element', (op)=>{
      addElement(op.element)
    });
    s.on('update-element', (op)=>{
      useBoardStore.getState().updateElement(op.element)
    });
    s.on('delete-element', (op)=>{
      useBoardStore.getState().deleteElement(op.elementId)
    });
    s.on('cursor-move', (payload)=>{
      updateLiveCursor(payload.userId, payload.x, payload.y, payload.name, getUserColor(payload.userId))
    });
    s.on('user-left', (payload)=>{
      removeLiveCursor(payload.userId)
    });
    
    return ()=>{
      s.emit('leave-board', { boardId });
      s.disconnect();
    }
  },[boardId, currentUser])

  // Mouse move handler on stage
  const handleMouseMove = (e) => {
    const pos = stageRef.current?.getPointerPosition()
    if (pos) {
      throttledCursorMove(pos.x, pos.y)
    }
  }

  // simple double-click to add rectangle for demo
  const handleDblClick = (e) =>{
    if (isViewer) return // Prevent drawing in viewer mode
    
    const pos = stageRef.current.getPointerPosition();
    const el = { id: `${Date.now()}`, type: 'rect', x: pos.x, y: pos.y, width: 120, height: 80, fill: '#88f' }
    addElement(el)
    if (socket) socket.emit('draw-element', { element: el })
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-white dark:bg-gray-700">
      <Stage 
        width={window.innerWidth} 
        height={window.innerHeight} 
        onDblClick={!isViewer ? handleDblClick : undefined}
        onMouseMove={handleMouseMove}
        ref={stageRef}
      >
        <Layer>
          {elements.map(el=>{
            if (el.type === 'rect') return <Rect key={el.id} {...el} draggable={!isViewer} />
            if (el.type === 'circle') return <Circle key={el.id} x={el.x} y={el.y} radius={el.width/2} fill={el.fill} draggable={!isViewer} />
            if (el.type === 'line') return <Line key={el.id} points={el.points || []} stroke={el.stroke || 'black'} />
            if (el.type === 'text') return <Text key={el.id} x={el.x} y={el.y} text={el.text} />
            return null
          })}
        </Layer>
      </Stage>
      <LiveCursors cursors={liveCursors} />
    </div>
  )
}
