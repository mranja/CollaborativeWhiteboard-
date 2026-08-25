import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Arrow, Transformer, RegularPolygon, Star, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import { connectSocket, getSocket } from '../lib/socketClient'
import useBoardStore from '../store/useBoardStore'
import { useThrottledCursorMove } from '../hooks/useThrottledCursorMove'
import LiveCursors from './LiveCursors'
import { getSocketToken } from '../api/client'
import { v4 as uuidv4 } from 'uuid'
import jsPDF from 'jspdf'
import * as pdfjsLib from 'pdfjs-dist'

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const ImageComponent = ({ element, currentTool, isViewer, onElementClick, onDragEnd, onTransformEnd }) => {
  const [image] = useImage(element.src)
  return (
    <KonvaImage
      id={element.id}
      image={image}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation || 0}
      scaleX={element.scaleX || 1}
      scaleY={element.scaleY || 1}
      draggable={currentTool === 'select' && !isViewer}
      onClick={(e) => onElementClick(e, element.id)}
      onTap={(e) => onElementClick(e, element.id)}
      onDragEnd={(e) => onDragEnd(e, element.id)}
      onTransformEnd={onTransformEnd}
    />
  )
}

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const BOARD_SOCKET_URL = `${SOCKET_URL.replace(/\/$/, '')}/board`
const USER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

const CanvasBoard = forwardRef(({ boardId, userRole = 'editor', onSocketChange, theme = 'dark' }, ref) => {
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const transformerRef = useRef(null)
  const [socket, setSocket] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [newElement, setNewElement] = useState(null)
  const [scale, setScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [previewElements, setPreviewElements] = useState({}) 
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
  
  const [editingTextId, setEditingTextId] = useState(null)
  const [textEditValue, setTextEditValue] = useState('')
  const [textEditPos, setTextEditPos] = useState({ x: 0, y: 0 })
  const textEditorRef = useRef(null)

  useEffect(() => {
    if (editingTextId && textEditorRef.current) {
      textEditorRef.current.focus()
    }
  }, [editingTextId])

  const { 
    elements, addElement, updateElement, deleteElement, 
    liveCursors, updateLiveCursor, removeLiveCursor, 
    currentUser, currentTool, strokeColor, strokeWidth 
  } = useBoardStore()
  
  const isViewer = userRole === 'viewer'

  // --- Handle Resize perfectly ---
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize() // Initial check
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // --- Imperative API for Export ---
  useImperativeHandle(ref, () => ({
    exportImage: (format = 'png') => {
      if (!stageRef.current) return
      const oldNodes = transformerRef.current?.nodes()
      transformerRef.current?.nodes([])
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })
      if (format === 'png') {
        const link = document.createElement('a')
        link.download = `whiteboard-${boardId}.png`
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (format === 'pdf') {
        const pdf = new jsPDF('l', 'px', [dimensions.width, dimensions.height])
        pdf.addImage(dataURL, 'PNG', 0, 0, dimensions.width, dimensions.height)
        pdf.save(`whiteboard-${boardId}.pdf`)
      }
      if (oldNodes) transformerRef.current?.nodes(oldNodes)
    }
  }))

  // --- Socket Sync Logic ---
  useEffect(() => {
    const token = getSocketToken()
    if (!token) return
    const s = connectSocket(token)
    setSocket(s)
    onSocketChange?.(s)

    const joinRoom = () => {
      s.emit('join-board', { boardId }, (ack) => {
        if (ack?.ok) {
          console.log(`Joined board ${boardId} with role: ${ack.role}`)
        } else if (ack?.message) {
          console.warn('Join board ack error:', ack.message)
        }
      })
    }

    if (s.connected) {
      joinRoom()
    }
    s.on('connect', joinRoom)

    const handleDrawElement = (op) => {
      addElement(op.element)
      setPreviewElements(prev => {
        const next = { ...prev }
        delete next[op.userId]
        return next
      })
    }

    const handleDrawingPreview = (op) => {
      setPreviewElements(prev => ({ ...prev, [op.userId]: op.element }))
    }

    const handleUpdateElement = (op) => {
      useBoardStore.getState().updateElement(op.element)
    }

    const handleDeleteElement = (op) => {
      useBoardStore.getState().deleteElement(op.elementId)
    }

    const handleCursorMove = (p) => {
      updateLiveCursor(
        p.userId,
        p.x,
        p.y,
        p.name,
        USER_COLORS[p.userId?.charCodeAt(0) % USER_COLORS.length]
      )
    }

    const handleUserLeft = (p) => {
      removeLiveCursor(p.userId)
    }

    const handleBoardError = (payload) => {
      console.warn('Board socket error:', payload?.message)
    }

    s.on('board-error', handleBoardError)
    s.on('draw-element', handleDrawElement)
    s.on('drawing-preview', handleDrawingPreview)
    s.on('update-element', handleUpdateElement)
    s.on('delete-element', handleDeleteElement)
    s.on('cursor-move', handleCursorMove)
    s.on('user-left', handleUserLeft)

    return () => {
      try { s.emit('leave-board', { boardId }) } catch (e) {}
      s.off('connect', joinRoom)
      s.off('board-error', handleBoardError)
      s.off('draw-element', handleDrawElement)
      s.off('drawing-preview', handleDrawingPreview)
      s.off('update-element', handleUpdateElement)
      s.off('delete-element', handleDeleteElement)
      s.off('cursor-move', handleCursorMove)
      s.off('user-left', handleUserLeft)
    }
  }, [boardId])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !isViewer && !editingTextId) {
        deleteElement(selectedId)
        socket?.emit('delete-element', { elementId: selectedId })
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, isViewer, socket, editingTextId])

  const handleWheel = (e) => {
    e.evt.preventDefault()
    const scaleBy = 1.1
    const stage = stageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale }
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    setScale(newScale)
    setStagePos({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale })
  }

  const throttledCursorMove = useThrottledCursorMove((x, y) => { if (socket) socket.emit('cursor-move', { x, y }) })

  const getRelativePointerPosition = (stage) => {
    const pointerPos = stage.getPointerPosition()
    if (!pointerPos) return { x: 0, y: 0 }
    return { x: (pointerPos.x - stage.x()) / stage.scaleX(), y: (pointerPos.y - stage.y()) / stage.scaleY() }
  }

  // Effect to handle tool-specific initialization
  useEffect(() => {
    if (currentTool === 'import') {
      fileInputRef.current?.click()
      // Immediately switch back to select to avoid loop
      useBoardStore.getState().setCurrentTool('select')
    }
  }, [currentTool])

  const handleFileImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const pos = { x: 100, y: 100 } // Default drop position or use center

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const id = uuidv4()
        const element = {
          id,
          type: 'image',
          x: pos.x,
          y: pos.y,
          src: event.target.result,
          width: 300,
          height: 300,
          draggable: true
        }
        addElement(element)
        socket?.emit('draw-element', { element })
      }
      reader.readAsDataURL(file)
    } else if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const page = await pdf.getPage(1) // Just get first page for now
        const viewport = page.getViewport({ scale: 1.5 })
        
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width
        
        await page.render({ canvasContext: context, viewport }).promise
        
        const id = uuidv4()
        const element = {
          id,
          type: 'image',
          x: pos.x,
          y: pos.y,
          src: canvas.toDataURL(),
          width: viewport.width,
          height: viewport.height,
          draggable: true
        }
        addElement(element)
        socket?.emit('draw-element', { element })
      } catch (err) {
        console.error('PDF Import Error:', err)
      }
    }
    // reset input
    e.target.value = ''
  }

  const handleMouseDown = (e) => {
    if (isViewer) return
    if (editingTextId) return // Don't interrupt text editing with new clicks
    const stage = e.target.getStage()
    const pos = getRelativePointerPosition(stage)
    
    if (currentTool === 'select' || currentTool === 'pan') {
      if (e.target === stage) setSelectedId(null)
      return
    }

    if (currentTool === 'text') {
      setIsDrawing(true)
      setNewElement({
        id: uuidv4(),
        type: 'text-preview',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        stroke: strokeColor
      })
      return
    }

    setIsDrawing(true)
    const id = uuidv4()
    let element = { id, type: currentTool, x: pos.x, y: pos.y, stroke: strokeColor, strokeWidth: strokeWidth, draggable: true }
    if (currentTool === 'pencil') element.points = [pos.x, pos.y]
    else if (['rect', 'circle', 'triangle', 'star'].includes(currentTool)) { element.width = 0; element.height = 0; }
    else if (['arrow', 'line'].includes(currentTool)) element.points = [pos.x, pos.y, pos.x, pos.y]
    setNewElement(element)
  }

  const handleMouseMove = (e) => {
    const stage = e.target.getStage()
    const rawPos = stage.getPointerPosition() || { x: 0, y: 0 }
    const relPos = getRelativePointerPosition(stage)
    throttledCursorMove(rawPos.x, rawPos.y)

    // Update screen pos for cursor previews (like eraser)
    if (currentTool === 'eraser') {
      setTextEditPos(rawPos)
    }

    // Continuous Eraser - MS Paint Style
    if (currentTool === 'eraser' && e.evt.buttons === 1) {
      const stage = stageRef.current
      // Check a small 10x10 area for continuous erasing
      const size = 10
      for (let i = -size/2; i <= size/2; i += 5) {
        for (let j = -size/2; j <= size/2; j += 5) {
          const shape = stage.getIntersection({ x: rawPos.x + i, y: rawPos.y + j })
          if (shape && shape.id() && shape.name() !== 'grid') {
            deleteElement(shape.id())
            socket?.emit('delete-element', { elementId: shape.id() })
          }
        }
      }
    }

    if (!isDrawing || !newElement) return
    let updated = { ...newElement }
    if (currentTool === 'pencil') updated.points = [...updated.points, relPos.x, relPos.y]
    else if (['rect', 'circle', 'triangle', 'star', 'text-preview'].includes(currentTool) || newElement.type === 'text-preview') { 
      updated.width = relPos.x - updated.x; 
      updated.height = relPos.y - updated.y; 
    }
    else if (['arrow', 'line'].includes(currentTool)) updated.points = [updated.x, updated.y, relPos.x, relPos.y]
    setNewElement(updated)
    if (socket) socket.emit('drawing-preview', { element: updated })
  }

  const handleMouseUp = () => {
    if (!isDrawing || !newElement) {
      setIsDrawing(false)
      return
    }
    setIsDrawing(false)
    
    if (newElement.type === 'text-preview') {
      // Convert preview box to actual text element
      const id = uuidv4()
      const element = {
        id,
        type: 'text',
        x: newElement.x,
        y: newElement.y,
        width: Math.abs(newElement.width) > 20 ? Math.abs(newElement.width) : 200,
        height: Math.abs(newElement.height) > 20 ? Math.abs(newElement.height) : 50,
        text: '',
        stroke: strokeColor,
        draggable: true
      }
      
      addElement(element)
      socket?.emit('draw-element', { element })
      
      // Open editor
      const stage = stageRef.current
      const screenPos = stage.getPointerPosition()
      setEditingTextId(id)
      setTextEditValue('')
      setTextEditPos(screenPos)
      setNewElement(null)
      return
    }

    if (['rect', 'circle', 'triangle', 'star'].includes(newElement.type) && Math.abs(newElement.width) < 5) { setNewElement(null); return; }
    addElement(newElement); socket?.emit('draw-element', { element: newElement }); setNewElement(null);
  }

  const handleElementClick = (e, id) => {
    if (isViewer) return
    if (currentTool === 'select') setSelectedId(id)
    if (currentTool === 'eraser') { deleteElement(id); socket?.emit('delete-element', { elementId: id }) }
  }

  const handleTextDblClick = (e, el) => {
    if (isViewer) return
    const stage = stageRef.current
    const screenPos = stage.getPointerPosition()
    setEditingTextId(el.id)
    setTextEditValue(el.text)
    setTextEditPos(screenPos)
    setSelectedId(null)
  }

  const handleTextSubmit = () => {
    if (!editingTextId) return
    const updated = { id: editingTextId, text: textEditValue }
    updateElement(updated)
    socket?.emit('update-element', { element: updated })
    setEditingTextId(null)
  }

  const handleTransformEnd = (e) => {
    const node = e.target
    const updated = { id: selectedId, x: node.x(), y: node.y(), rotation: node.rotation(), scaleX: node.scaleX(), scaleY: node.scaleY() }
    updateElement(updated); socket?.emit('update-element', { element: updated })
  }

  const handleDragEnd = (e, id) => {
    const updated = { id, x: e.target.x(), y: e.target.y() }
    updateElement(updated); socket?.emit('update-element', { element: updated })
  }

  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const selectedNode = stageRef.current.findOne('#' + selectedId)
      if (selectedNode) transformerRef.current.nodes([selectedNode])
      else transformerRef.current.nodes([])
    } else if (transformerRef.current) transformerRef.current.nodes([])
    transformerRef.current?.getLayer()?.batchDraw()
  }, [selectedId, elements])

  const renderElement = (el, opacity = 1) => {
    const commonProps = {
      key: el.id, id: el.id, x: el.x, y: el.y, stroke: el.stroke, strokeWidth: el.strokeWidth, opacity,
      rotation: el.rotation || 0, scaleX: el.scaleX || 1, scaleY: el.scaleY || 1,
      draggable: currentTool === 'select' && !isViewer && editingTextId !== el.id,
      onClick: (e) => handleElementClick(e, el.id),
      onTap: (e) => handleElementClick(e, el.id),
      onDragEnd: (e) => handleDragEnd(e, el.id),
      onTransformEnd: handleTransformEnd,
    }
    if (el.type === 'rect') return <Rect {...commonProps} width={el.width} height={el.height} />
    if (el.type === 'circle') return <Circle {...commonProps} radius={Math.sqrt(Math.pow(el.width || 0, 2) + Math.pow(el.height || 0, 2))} />
    if (el.type === 'triangle') return <RegularPolygon {...commonProps} sides={3} radius={Math.abs(el.width || 20)} />
    if (el.type === 'star') return <Star {...commonProps} innerRadius={Math.abs(el.width || 20) / 2} outerRadius={Math.abs(el.width || 20)} numPoints={5} />
    if (el.type === 'pencil') return <Line {...commonProps} x={0} y={0} points={el.points} tension={0.5} lineCap="round" lineJoin="round" />
    if (el.type === 'line') return <Line {...commonProps} x={0} y={0} points={el.points} />
    if (el.type === 'arrow') return <Arrow {...commonProps} x={0} y={0} points={el.points} fill={el.stroke} />
    if (el.type === 'text') {
      return (
        <Text 
          {...commonProps} 
          text={el.text} 
          width={el.width}
          fontSize={20} 
          fill={el.stroke} 
          fontFamily="Inter, sans-serif" 
          shadowEnabled={false}
          onDblClick={(e) => handleTextDblClick(e, el)}
          onDblTap={(e) => handleTextDblClick(e, el)}
          visible={editingTextId !== el.id}
        />
      )
    }
    if (el.type === 'image') {
      return (
        <ImageComponent 
          key={el.id} 
          element={el} 
          currentTool={currentTool} 
          isViewer={isViewer} 
          onElementClick={handleElementClick}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
      )
    }
    if (el.type === 'text-preview') {
      return (
        <Rect 
          {...commonProps} 
          width={el.width} 
          height={el.height} 
          fill="transparent" 
          stroke={el.stroke} 
          dash={[5, 5]} 
        />
      )
    }
    return null
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full relative overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-white'} 
      ${currentTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 
        currentTool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'}`}
    >
      <div className={`absolute inset-0 pointer-events-none opacity-[0.2]`} 
        style={{ 
          backgroundImage: `radial-gradient(circle, ${theme === 'dark' ? '#334155' : '#e2e8f0'} 1.5px, transparent 1.5px)`, 
          backgroundSize: `${35 * scale}px ${35 * scale}px`, 
          backgroundPosition: `${stagePos.x}px ${stagePos.y}px` 
        }}
      />
      
      <Stage 
        width={dimensions.width} 
        height={dimensions.height} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
        onWheel={handleWheel}
        draggable={currentTool === 'pan'} 
        scaleX={scale} 
        scaleY={scale} 
        x={stagePos.x} 
        y={stagePos.y} 
        ref={stageRef}
      >
        <Layer>
          {elements.map((el) => renderElement(el))}
          {Object.entries(previewElements).map(([userId, el]) => el && renderElement(el, 0.4))}
          {newElement && renderElement(newElement, 0.6)}
          {selectedId && !isViewer && <Transformer ref={transformerRef} rotateEnabled={true} flipEnabled={false} boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5) ? oldBox : newBox} />}
        </Layer>
      </Stage>
      <LiveCursors cursors={liveCursors} />

      {/* Eraser Cursor Preview */}
      {currentTool === 'eraser' && !isViewer && (
        <div 
          className="absolute border border-indigo-500 bg-white/20 pointer-events-none z-[110]"
          style={{
            width: '20px',
            height: '20px',
            left: `${textEditPos.x - 10}px`,
            top: `${textEditPos.y - 10}px`,
            display: isDrawing ? 'none' : 'block' // hide while erasing to avoid lag
          }}
        />
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,application/pdf"
        onChange={handleFileImport}
      />

      {editingTextId && (
        <textarea
          ref={textEditorRef}
          placeholder="Start typing..."
          autoFocus
          value={textEditValue}
          onChange={(e) => setTextEditValue(e.target.value)}
          onBlur={handleTextSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleTextSubmit()
            }
          }}
          style={{
            position: 'absolute',
            top: textEditPos.y,
            left: textEditPos.x,
            width: (elements.find(e => e.id === editingTextId)?.width || 200) * scale,
            height: (elements.find(e => e.id === editingTextId)?.height || 50) * scale,
            background: theme === 'dark' ? '#1e293b' : 'white',
            border: '2px dashed #6366f1',
            color: (theme === 'dark' && (strokeColor === '#000000' || strokeColor === '#1e293b')) ? '#ffffff' : (theme === 'light' && strokeColor === '#ffffff') ? '#0f172a' : strokeColor,
            fontSize: `${20 * scale}px`,
            fontFamily: 'Inter, sans-serif',
            padding: '4px',
            outline: 'none',
            resize: 'none',
            zIndex: 100,
            overflow: 'hidden',
            lineHeight: 1.2,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            borderRadius: '4px'
          }}
        />
      )}

      {/* View Controls */}
      <div className="absolute bottom-6 right-6 flex items-center space-x-3 pointer-events-none">
        <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-widest uppercase shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-400'}`}>
          {Math.round(scale * 100)}%
        </div>
        <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-widest uppercase shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-white/10 text-indigo-400' : 'bg-white border-slate-200 text-indigo-500'}`}>
          {currentTool}
        </div>
      </div>
    </div>
  )
})

export default CanvasBoard
