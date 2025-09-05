import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badges: { type: [String], default: [] },
  points: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Reward', rewardSchema);
