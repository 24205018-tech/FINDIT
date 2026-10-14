import { Router } from 'express';
import mongoose from 'mongoose';
import { Claim, formatClaim } from '../models/Claim.js';
import { Item } from '../models/Item.js';
import { Notification } from '../models/Notification.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { createClaimStatusNotification } from '../utils/claimNotifications.js';
import { markClaimAndAssociatedItemsRecovered } from '../utils/claimRecovery.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      filter.user = req.user._id;
    } else if (req.query.userId) {
      if (mongoose.isValidObjectId(req.query.userId)) {
        filter.user = req.query.userId;
      }
    }

    const claims = await Claim.find(filter)
      .populate('item')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: claims.map(formatClaim) });
  } catch (err) {
    console.error('List claims error:', err);
    res.status(500).json({ success: false, message: 'Failed to load claims.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    const claim = await Claim.findById(req.params.id)
      .populate('item')
      .populate('user', 'name email');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    const claimUserId = claim.user?._id ? claim.user._id.toString() : claim.user?.toString();
    if (req.user.role === 'student' && claimUserId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    res.json({ success: true, data: formatClaim(claim) });
  } catch (err) {
    console.error('Get claim error:', err);
    res.status(500).json({ success: false, message: 'Failed to load claim.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const itemId = b.itemId || b.item_id;

    if (!itemId || !b.reason) {
      return res.status(400).json({
        success: false,
        message: 'Item and reason are required.',
      });
    }

    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID.',
      });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    const claim = await Claim.create({
      item: item._id,
      user: req.user._id,
      item_kind: b.itemKind || b.item_kind || item.kind || 'found',
      reason: String(b.reason).trim(),
      hidden_detail: b.hiddenDetail || b.hidden_detail || '',
      additional_info: b.additionalInfo || b.additional_info || '',
      proof_name: b.proofName || b.proof_name || '',
      proof_preview: b.proofPreview || b.proof_preview || '',
      status: 'Pending',
    });

    await claim.populate('item');
    await claim.populate('user', 'name email');

    res.status(201).json({ success: true, data: formatClaim(claim) });
  } catch (err) {
    console.error('Submit claim error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit claim.' });
  }
});

router.put('/:id/status', allowRoles('admin', 'teacher'), async (req, res) => {
  try {
    const s = req.body?.status;
    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Under Review'];
    if (!validStatuses.includes(s)) {
      return res.status(400).json({ success: false, message: 'Invalid claim status.' });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    claim.status = s;
    await claim.save();

    await claim.populate('item');
    await claim.populate('user', 'name email');

    if (s === 'Approved') {
      await markClaimAndAssociatedItemsRecovered(claim);
    }

    if (s === 'Approved' || s === 'Rejected') {
      const targetUserId = claim.user?._id || claim.user;
      const itemTitle = claim.item?.title || 'item';
      await createClaimStatusNotification(Notification, {
        user: targetUserId,
        itemTitle,
        status: s,
        reason: req.body?.reason,
      });
    }

    res.json({ success: true, data: formatClaim(claim) });
  } catch (err) {
    console.error('Update claim status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update claim status.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    const claimUserId = claim.user?._id ? claim.user._id.toString() : claim.user?.toString();
    if (claimUserId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    await Claim.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete claim error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete claim.' });
  }
});

export default router;
