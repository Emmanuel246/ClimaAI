import Reward from '../models/Reward.js';

export async function completeChallenge(req, res, next) {
  try {
    const { badge, points = 10 } = req.body;
    const doc = await Reward.findOneAndUpdate(
      { userId: req.user.id },
      { $addToSet: { badges: badge }, $inc: { points } },
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (e) { next(e); }
}

export async function getRewards(req, res, next) {
  try {
    const doc = await Reward.findOne({ userId: req.user.id }) || { badges: [], points: 0 };
    res.json(doc);
  } catch (e) { next(e); }
}
