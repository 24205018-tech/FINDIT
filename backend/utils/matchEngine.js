/**
 * Match engine — ported from frontend src/utils/matchEngine.js
 * Pure functions, server-side usable.
 */

function computeMatchScore(lostItem, foundItem) {
  if (!lostItem || !foundItem) return 0;

  const tokens = (s = '') => String(s).toLowerCase().split(/[\s/.,-]+/).filter(Boolean);
  const words = (s = '') => new Set(tokens(s));
  const brandTokens = new Set(tokens(lostItem.brand).filter(t => t !== '—'));
  const brandMatches = [...words(foundItem.brand || '')].filter(w => brandTokens.has(w)).length;

  let score = 0;
  if (lostItem.category === foundItem.category) score += 24;
  if ((lostItem.colour || '').toLowerCase() === (foundItem.colour || '').toLowerCase()) score += 18;
  else if (['Black','Grey','Dark'].some(c => (lostItem.colour || '').includes(c) && (foundItem.colour || '').includes(c))) score += 6;

  const loc = (l='') => l.toLowerCase();
  const locA = loc(lostItem.location);
  const locB = loc(foundItem.location);
  if (locA && locA === locB) score += 22;
  else if (locA && locB && (locA.includes(locB.slice(0,5)) || locB.includes(locA.slice(0,5)))) score += 12;

  if (lostItem.title && foundItem.title) {
    const a = words(lostItem.title);
    const b = words(foundItem.title);
    const shared = [...a].filter(w => b.has(w)).length;
    score += Math.min(18, shared * 6);
  }
  if (brandTokens.size > 0 && brandMatches > 0) score += 12;

  try {
    const d1 = new Date(`${lostItem.date}T${lostItem.time || '12:00'}`);
    const d2 = new Date(`${foundItem.date}T${foundItem.time || '12:00'}`);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      const hrs = Math.abs(d2 - d1) / 36e5;
      if (hrs <= 6) score += 8;
      else if (hrs <= 24) score += 4;
    }
  } catch {}

  return Math.min(97, Math.round(score));
}

function timeDiffLabel(a, b) {
  try {
    const d1 = new Date(a);
    const d2 = new Date(b);
    const hrs = Math.abs(d2 - d1) / 36e5;
    if (hrs < 1) return `${Math.round(hrs*60)} minutes apart`;
    if (hrs < 24) return `${Math.round(hrs)} hours apart`;
    return `${Math.round(hrs/24)} days apart`;
  } catch { return ''; }
}

function buildMatchCatalogue(allLost, allFound, currentUserId = null, threshold = 58) {
  const matches = [];
  let idx = 0;

  const consider = (lost, found) => {
    const score = computeMatchScore(lost, found);
    if (score < threshold) return null;
    return {
      id: `M-AUTO-${idx++}`,
      lostItemId: lost.id,
      foundItemId: found.id,
      score,
      matchedAt: new Date().toISOString(),
      viewed: false,
      claimed: false,
      reason: score >= 85 ? 'Strong overlap in category, colour and location.' : 'Similar category and attributes detected.',
      lostItem: lost,
      foundItem: found,
      timeDiff: timeDiffLabel(lost.createdAt, found.createdAt)
    };
  };

  if (currentUserId) {
    allLost.forEach(lost => {
      if (String(lost.userId) !== String(currentUserId) && String(lost.user_id) !== String(currentUserId)) return;
      allFound.forEach(found => {
        const m = consider(lost, found);
        if (m) matches.push(m);
      });
    });
    allFound.forEach(found => {
      if (String(found.userId) !== String(currentUserId) && String(found.user_id) !== String(currentUserId)) return;
      allLost.forEach(lost => {
        // avoid duplicates
        if (matches.some(x => String(x.lostItemId) === String(lost.id) && String(x.foundItemId) === String(found.id))) return;
        const m = consider(lost, found);
        if (m) matches.push(m);
      });
    });
  } else {
    allLost.forEach(lost => {
      allFound.forEach(found => {
        const m = consider(lost, found);
        if (m) matches.push(m);
      });
    });
  }

  return matches.sort((a,b) => b.score - a.score);
}

module.exports = { computeMatchScore, buildMatchCatalogue, timeDiffLabel };
