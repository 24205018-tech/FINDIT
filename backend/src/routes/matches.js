import { Router } from 'express';
import mongoose from 'mongoose';
import { Item, formatItem } from '../models/Item.js';
import { Match, formatMatch } from '../models/Match.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function calculateMatchScore(lost, found) {
  let score = 65;
  if (lost.category && found.category && lost.category.toLowerCase() === found.category.toLowerCase()) {
    score += 15;
  }
  if (lost.location && found.location && lost.location.trim().toLowerCase() === found.location.trim().toLowerCase()) {
    score += 10;
  }
  if (
    lost.colour &&
    found.colour &&
    lost.colour !== '—' &&
    found.colour !== '—' &&
    lost.colour.trim().toLowerCase() === found.colour.trim().toLowerCase()
  ) {
    score += 5;
  }
  return Math.min(score, 95);
}

router.get('/', async (req, res) => {
  try {
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'teacher';
    const targetUserId = req.query.userId || req.user._id.toString();

    // Query active lost and found items (exclude Recovered and Claimed items)
    const activeFilter = { status: { $nin: ['Recovered', 'Claimed'] } };
    const [lostItems, foundItems] = await Promise.all([
      Item.find({ kind: 'lost', ...activeFilter }).populate('user', 'name email').sort({ createdAt: -1 }).limit(100),
      Item.find({ kind: 'found', ...activeFilter }).populate('user', 'name email').sort({ createdAt: -1 }).limit(100),
    ]);

    const results = [];
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    for (const lost of lostItems) {
      for (const found of foundItems) {
        if (lost.category && found.category && lost.category.toLowerCase() === found.category.toLowerCase()) {
          const lostUserId = lost.user?._id ? lost.user._id.toString() : (lost.user ? lost.user.toString() : '');
          const foundUserId = found.user?._id ? found.user._id.toString() : (found.user ? found.user.toString() : '');

          if (
            isPrivileged ||
            lostUserId === targetUserId ||
            foundUserId === targetUserId ||
            lostUserId === req.user._id.toString() ||
            foundUserId === req.user._id.toString()
          ) {
            const score = calculateMatchScore(lost, found);

            // Upsert into Match collection to keep Match model active and populated
            let matchDoc = await Match.findOne({ lost_item: lost._id, found_item: found._id });
            if (!matchDoc) {
              matchDoc = await Match.create({
                lost_item: lost._id,
                found_item: found._id,
                lost_user: lost.user?._id || lost.user,
                found_user: found.user?._id || found.user,
                score,
                status: 'potential',
              }).catch(() => null);
            }

            const formattedLost = formatItem(lost);
            const formattedFound = formatItem(found);

            results.push({
              id: matchDoc?._id ? matchDoc._id.toString() : `${lost._id}_${found._id}`,
              _id: matchDoc?._id || `${lost._id}_${found._id}`,
              lostId: formattedLost.id,
              lostTitle: formattedLost.title,
              lostCategory: formattedLost.category,
              lostLocation: formattedLost.location,
              foundId: formattedFound.id,
              foundTitle: formattedFound.title,
              foundCategory: formattedFound.category,
              foundLocation: formattedFound.location,
              lostUserId,
              foundUserId,
              score,
              lostItem: formattedLost,
              foundItem: formattedFound,
              createdAt: matchDoc?.createdAt || lost.createdAt,
            });

            if (results.length >= limit) break;
          }
        }
      }
      if (results.length >= limit) break;
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Calculate matches error:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate matches.' });
  }
});

router.get('/item/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const oppositeKind = item.kind === 'lost' ? 'found' : 'lost';
    const matches = await Item.find({
      kind: oppositeKind,
      category: item.category,
      _id: { $ne: item._id },
      status: { $nin: ['Recovered', 'Claimed'] },
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: matches.map(formatItem) });
  } catch (err) {
    console.error('Item matches error:', err);
    res.status(500).json({ success: false, message: 'Failed to find item matches.' });
  }
});

export default router;
