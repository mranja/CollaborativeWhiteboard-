import { useEffect } from 'react'
import { fabric } from 'fabric'
import { useBoardStore } from '../stores/boardStore'

export function useFabric(ref) {
  const setFabricInstance = useBoardStore((s) => s.setFabricInstance)

  useEffect(() => {
    if (!ref.current) return
    const canvas = new fabric.Canvas(ref.current, {
      backgroundColor: 'transparent',
      preserveObjectStacking: true
    })
    setFabricInstance(canvas)

    return () => {
      canvas.dispose()
    }
  }, [ref])
}
