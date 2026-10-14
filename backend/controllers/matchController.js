const itemModel = require('../models/itemModel');
const { buildMatchCatalogue, computeMatchScore } = require('../utils/matchEngine');

async function getMatches(req, res) {
  try {
    const { userId, minScore = 58, threshold, limit = 100 } = req.query;
    const scoreThreshold = parseInt(threshold || minScore) || 58;

    const allLost = await itemModel.listItems({ kind: 'lost', limit: 500 });
    const allFound = await itemModel.listItems({ kind: 'found', limit: 500 });

    // If userId provided, filter to that user's items
    const effectiveUserId = userId || (req.user ? req.user.id : null);

    let matches = buildMatchCatalogue(allLost, allFound, effectiveUserId, scoreThreshold);
    if (limit) matches = matches.slice(0, parseInt(limit));

    res.json({ success: true, data: matches, total: matches.length });
  } catch (err) {
    console.error('Get matches error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute matches', error: err.message });
  }
}

async function getMatchesForItem(req, res) {
  try {
    const itemId = req.params.id;
    const item = await itemModel.getItemById(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const oppositeKind = item.kind === 'lost' ? 'found' : 'lost';
    const oppositeItems = await itemModel.listItems({ kind: oppositeKind, limit: 200 });

    const matches = oppositeItems
      .map(other => {
        const score = item.kind === 'lost' ? computeMatchScore(item, other) : computeMatchScore(other, item);
        return { item: other, score };
      })
      .filter(m => m.score >= 55)
      .sort((a,b) => b.score - a.score)
      .slice(0, 10);

    res.json({ success: true, data: matches });
  } catch (err) {
    console.error('Get matches for item error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch matches' });
  }
}

module.exports = { getMatches, getMatchesForItem };
