import User from '../models/User.js';

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (e) { next(e); }
}

export async function updateProfile(req, res, next) {
  try {
    const update = req.body;
    delete update.passwordHash;
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    res.json(user);
  } catch (e) { next(e); }
}
