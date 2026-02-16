const mongoose = require('mongoose');

const ElementSchema = new mongoose.Schema({
  id: String,
  type: String,
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  rotation: { type: Number, default: 0 },
  stroke: String,
  fill: String,
  text: String,
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
