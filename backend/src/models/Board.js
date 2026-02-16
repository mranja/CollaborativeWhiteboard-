const mongoose = require('mongoose');

const ElementSchema = new mongoose.Schema({
  id: String,
  type: String,
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  rotation: { type: Number, default: 0 },
  scaleX: { type: Number, default: 1 },
  scaleY: { type: Number, default: 1 },
  stroke: { type: String, default: '#000000' },
  strokeWidth: { type: Number, default: 2 },
  fill: { type: String, default: 'transparent' },
  text: String,
  points: [Number], // For lines/pencil
  meta: Object
}, { _id: false });

const BoardSchema = new mongoose.Schema({
  title: { type: String, default: 'Untitled' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  collaborators: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: { type: String, enum:['viewer','editor'] } }],
  elements: [ElementSchema],
  version: { type: Number, default: 1 }
}, { timestamps: true });

// Indexes for faster queries
BoardSchema.index({ owner: 1 });
BoardSchema.index({ 'collaborators.user': 1 });

module.exports = mongoose.model('Board', BoardSchema);
