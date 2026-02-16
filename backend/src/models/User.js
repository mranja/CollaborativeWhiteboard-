const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['viewer','editor','owner'], default: 'editor' }
}, { timestamps: true });

// Index email field for faster lookups during auth
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);
