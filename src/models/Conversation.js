import mongoose from 'mongoose';

const msgSchema = new mongoose.Schema({
  role: { type: String, enum: ['user','assistant'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [msgSchema]
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);
