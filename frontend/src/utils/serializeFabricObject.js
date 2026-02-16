export function serializeObject(obj) {
  const { type } = obj
  const base = {
    id: obj.id || obj.__uid || obj.toObject && obj.toObject().id,
    type,
    left: obj.left,
    top: obj.top,
    scaleX: obj.scaleX,
    scaleY: obj.scaleY,
    angle: obj.angle,
    width: obj.width || (obj.getScaledWidth && obj.getScaledWidth()),
    height: obj.height || (obj.getScaledHeight && obj.getScaledHeight()),
    fill: obj.fill,
    stroke: obj.stroke,
    strokeWidth: obj.strokeWidth
  }
  if (type === 'path' || obj.isType && obj.isType('path')) {
    base.path = obj.path ? obj.path : (obj.toObject && obj.toObject().path)
  }
  if (type === 'rect' || type === 'ellipse' || type === 'circle') {
    base.rx = obj.rx
    base.ry = obj.ry
  }
  if (type === 'line') {
    base.x1 = obj.x1
    base.y1 = obj.y1
    base.x2 = obj.x2
    base.y2 = obj.y2
  }
  if (type === 'text' || obj.isType && obj.isType('textbox')) {
    base.text = obj.text || obj.textLines || ''
    base.fontSize = obj.fontSize
    base.fontFamily = obj.fontFamily
    base.fill = obj.fill
  }
  // images
  if (obj.src) base.src = obj.src
  // groups
  if (type === 'group' || (obj.type === 'group' && obj._objects)) {
    base.objects = (obj._objects || []).map(o => serializeObject(o))
  }
  return base
}
