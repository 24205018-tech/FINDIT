import { Item } from '../models/Item.js';
import { Match } from '../models/Match.js';
import { Claim } from '../models/Claim.js';

/**
 * When a claim is approved, marks both the claimed item and its associated item
 * (e.g. the claimant's lost item for a claimed found item) as 'Recovered'.
 * Also confirms any corresponding match record.
 */
export async function markClaimAndAssociatedItemsRecovered(
  claim,
  { ItemModel = Item, MatchModel = Match } = {}
) {
  if (!claim) return null;
  const claimedItemId = claim.item?._id || claim.item;
  const claimantUserId = claim.user?._id || claim.user;
  if (!claimedItemId) return null;

    // 1. Mark the claimed item as Recovered
    let claimedItem = claim.item && claim.item._id ? claim.item : null;
    if (!claimedItem || !claimedItem.save) {
      claimedItem = await ItemModel.findById(claimedItemId);
    }
    if (claimedItem && claimedItem.status !== 'Recovered') {
      claimedItem.status = 'Recovered';
      await claimedItem.save();
    }

    let associatedLostItemId = null;
    let associatedFoundItemId = null;

    const itemKind = claimedItem?.kind || claim.item_kind || 'found';

    if (itemKind === 'found') {
      associatedFoundItemId = claimedItemId;

      // Find the associated lost item via Match
      const match = await MatchModel.findOne({
        found_item: claimedItemId,
        ...(claimantUserId ? { lost_user: claimantUserId } : {}),
      });

      if (match && match.lost_item) {
        associatedLostItemId = match.lost_item?._id || match.lost_item;
        if (match.status !== 'confirmed') {
          match.status = 'confirmed';
          await match.save();
        }
      } else if (claimantUserId) {
        // Fallback: search claimant's lost item by matching category or title
        const query = {
          user: claimantUserId,
          kind: 'lost',
          status: { $ne: 'Recovered' },
        };
        const queryRes = ItemModel.find(query);
        const candidates = (typeof queryRes?.sort === 'function' ? await queryRes.sort({ createdAt: -1 }) : await queryRes) || [];
        if (candidates.length > 0) {
          let best = null;
          if (claimedItem?.title) {
            const claimedWords = claimedItem.title.toLowerCase().split(/\s+/).filter(Boolean);
            best = candidates.find(c => {
              const cWords = (c.title || '').toLowerCase().split(/\s+/).filter(Boolean);
              return claimedWords.some(w => cWords.includes(w)) && (!claimedItem.category || c.category === claimedItem.category);
            });
          }
          if (!best && claimedItem?.category) {
            best = candidates.find(c => c.category === claimedItem.category);
          }
          const chosen = best || candidates[0];
          associatedLostItemId = chosen._id;
        }
      }

      if (associatedLostItemId) {
        await ItemModel.findByIdAndUpdate(associatedLostItemId, { status: 'Recovered' });
        // Confirm any matches between these two items
        await MatchModel.updateMany(
          {
            $or: [
              { lost_item: associatedLostItemId, found_item: claimedItemId },
              { lost_item: associatedLostItemId },
            ],
          },
          { status: 'confirmed' }
        );
      }
    } else if (itemKind === 'lost') {
      associatedLostItemId = claimedItemId;

      // Find associated found item via Match
      const match = await MatchModel.findOne({
        lost_item: claimedItemId,
        ...(claimantUserId ? { found_user: claimantUserId } : {}),
      });

      if (match && match.found_item) {
        associatedFoundItemId = match.found_item?._id || match.found_item;
        if (match.status !== 'confirmed') {
          match.status = 'confirmed';
          await match.save();
        }
      } else if (claimantUserId) {
        const query = {
          user: claimantUserId,
          kind: 'found',
          status: { $ne: 'Recovered' },
        };
        const queryRes = ItemModel.find(query);
        const candidates = (typeof queryRes?.sort === 'function' ? await queryRes.sort({ createdAt: -1 }) : await queryRes) || [];
        if (candidates.length > 0) {
          let best = null;
          if (claimedItem?.title) {
            const claimedWords = claimedItem.title.toLowerCase().split(/\s+/).filter(Boolean);
            best = candidates.find(c => {
              const cWords = (c.title || '').toLowerCase().split(/\s+/).filter(Boolean);
              return claimedWords.some(w => cWords.includes(w)) && (!claimedItem.category || c.category === claimedItem.category);
            });
          }
          if (!best && claimedItem?.category) {
            best = candidates.find(c => c.category === claimedItem.category);
          }
          const chosen = best || candidates[0];
          associatedFoundItemId = chosen._id;
        }
      }

      if (associatedFoundItemId) {
        await ItemModel.findByIdAndUpdate(associatedFoundItemId, { status: 'Recovered' });
        await MatchModel.updateMany(
          {
            $or: [
              { lost_item: claimedItemId, found_item: associatedFoundItemId },
              { found_item: associatedFoundItemId },
            ],
          },
          { status: 'confirmed' }
        );
      }
    }

    return {
      claimedItemId,
      associatedLostItemId,
      associatedFoundItemId,
    };
  }

  /**
   * Reconciles any existing approved claims to ensure associated lost items
   * are marked as 'Recovered' in the database.
   */
  export async function syncApprovedClaimsRecovery({
    ClaimModel = Claim,
    ItemModel = Item,
    MatchModel = Match,
  } = {}) {
    try {
      const approvedClaims = await ClaimModel.find({ status: 'Approved' }).populate('item');
      const results = [];
      for (const claim of approvedClaims) {
        const res = await markClaimAndAssociatedItemsRecovered(claim, { ItemModel, MatchModel });
        if (res) results.push(res);
      }
      return results;
    } catch (err) {
      console.error('Error syncing approved claims recovery:', err.message);
      return [];
    }
  }
