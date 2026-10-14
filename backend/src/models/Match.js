import mongoose from 'mongoose';
import { formatItem } from './Item.js';

const matchSchema = new mongoose.Schema(
  {
    lost_item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    found_item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    lost_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    found_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    score: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['potential', 'confirmed', 'rejected'],
      default: 'potential',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

matchSchema.index({ lost_item: 1, found_item: 1 }, { unique: true });

export function formatMatch(m) {
  if (!m) return null;
  const obj = m.toObject ? m.toObject({ virtuals: true }) : m;
  const id = obj._id ? obj._id.toString() : (obj.id || '');

  const lost = obj.lost_item && typeof obj.lost_item === 'object' ? formatItem(obj.lost_item) : null;
  const found = obj.found_item && typeof obj.found_item === 'object' ? formatItem(obj.found_item) : null;

  const lostId = lost ? lost.id : (obj.lost_item ? obj.lost_item.toString() : (obj.lostId || ''));
  const foundId = found ? found.id : (obj.found_item ? obj.found_item.toString() : (obj.foundId || ''));

  const lostUserId = lost ? lost.userId : (obj.lost_user?._id ? obj.lost_user._id.toString() : (obj.lost_user ? obj.lost_user.toString() : (obj.lostUserId || '')));
  const foundUserId = found ? found.userId : (obj.found_user?._id ? obj.found_user._id.toString() : (obj.found_user ? obj.found_user.toString() : (obj.foundUserId || '')));

  const lostTitle = lost ? lost.title : (obj.lostTitle || '');
  const lostCategory = lost ? lost.category : (obj.lostCategory || '');
  const lostLocation = lost ? lost.location : (obj.lostLocation || '');

  const foundTitle = found ? found.title : (obj.foundTitle || '');
  const foundCategory = found ? found.category : (obj.foundCategory || '');
  const foundLocation = found ? found.location : (obj.foundLocation || '');

  const score = obj.score !== undefined ? obj.score : 75;

  return {
    id,
    _id: obj._id || id,
    lostId,
    foundId,
    lostTitle,
    foundTitle,
    lostCategory,
    foundCategory,
    lostLocation,
    foundLocation,
    lostUserId,
    foundUserId,
    score,
    status: obj.status || 'potential',
    lostItem: lost || {
      id: lostId,
      _id: lostId,
      title: lostTitle,
      category: lostCategory,
      location: lostLocation,
      userId: lostUserId,
      kind: 'lost',
    },
    foundItem: found || {
      id: foundId,
      _id: foundId,
      title: foundTitle,
      category: foundCategory,
      location: foundLocation,
      userId: foundUserId,
      kind: 'found',
    },
    createdAt: obj.createdAt || obj.created_at,
    updatedAt: obj.updatedAt || obj.updated_at,
  };
}

export const Match = mongoose.model('Match', matchSchema);
export default Match;
