const claimModel = require('../models/claimModel');
const itemModel = require('../models/itemModel');
const notificationModel = require('../models/notificationModel');

async function listClaims(req, res) {
  try {
    const { status, itemId, userId, limit = 100, offset = 0 } = req.query;
    const isAdmin = req.user.role === 'admin';
    const filterUserId = isAdmin ? (userId || null) : req.user.id;
    const claims = await claimModel.listClaims({ userId: filterUserId, status, itemId, limit, offset, isAdmin });
    res.json({ success: true, data: claims });
  } catch (err) {
    console.error('List claims error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch claims' });
  }
}

async function getClaim(req, res) {
  try {
    const claim = await claimModel.getClaimById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
    if (String(claim.userId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: claim });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch claim' });
  }
}

async function createClaim(req, res) {
  try {
    const { itemId, itemKind, reason, hiddenDetail, additionalInfo, proofName, proofPreview } = req.body;
    if (!itemId || !reason || !hiddenDetail) {
      return res.status(400).json({ success: false, message: 'itemId, reason and hiddenDetail are required' });
    }
    const item = await itemModel.getItemById(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (String(item.userId) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Cannot claim your own item' });
    }

    const claim = await claimModel.createClaim({
      item_id: itemId,
      item_kind: itemKind || item.kind || 'found',
      user_id: req.user.id,
      reason: reason.trim(),
      hidden_detail: hiddenDetail.trim(),
      additional_info: additionalInfo || '',
      proof_name: proofName || '',
      proof_preview: proofPreview || '',
    });

    // Notify item owner about new claim
    try {
      await notificationModel.createNotification({
        user_id: item.userId,
        type: 'claim',
        message: `New claim submitted for your ${item.title} by ${req.user.name}.`,
      });
      await notificationModel.createNotification({
        user_id: req.user.id,
        type: 'claim',
        message: `Your claim for ${item.title} was submitted and is now Pending.`,
      });
    } catch (e) {
      console.warn('Claim notification failed:', e.message);
    }

    res.status(201).json({ success: true, message: 'Claim submitted', data: claim });
  } catch (err) {
    console.error('Create claim error:', err);
    res.status(500).json({ success: false, message: 'Failed to create claim' });
  }
}

async function updateStatus(req, res) {
  try {
    const { status, reason } = req.body;
    if (!['Pending','Under Review','Approved','Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const claim = await claimModel.getClaimById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    const updated = await claimModel.updateClaimStatus(req.params.id, status);

    // Handle side effects
    try {
      if (status === 'Approved') {
        // Mark item as Recovered/Claimed
        await itemModel.updateItem(claim.itemId, { status: 'Recovered' });
        // Also mark paired lost item as recovered if possible (find match)
        // Notify claimant
        await notificationModel.createClaimStatusNotification(claim.userId, claim.itemTitle || 'your item', status);
        await notificationModel.createNotification({
          user_id: claim.userId,
          type: 'claim',
          message: `✅ Your claim ${updated.id} for ${claim.itemTitle} has been approved. Collect it at the front desk.`,
        });
      } else if (status === 'Rejected') {
        await notificationModel.createClaimStatusNotification(claim.userId, claim.itemTitle || 'your item', status);
      } else {
        await notificationModel.createClaimStatusNotification(claim.userId, claim.itemTitle || 'your item', status);
      }
    } catch (e) {
      console.warn('Post-status update failed:', e.message);
    }

    res.json({ success: true, message: `Claim ${status.toLowerCase()}`, data: updated });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Status update failed' });
  }
}

async function deleteClaim(req, res) {
  try {
    const claim = await claimModel.getClaimById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
    if (String(claim.userId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const ok = await claimModel.deleteClaim(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Claim not found' });
    res.json({ success: true, message: 'Claim deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
}

module.exports = { listClaims, getClaim, createClaim, updateStatus, deleteClaim };
