import { Router } from 'express';
import mongoose from 'mongoose';
import { Item, formatItem } from '../models/Item.js';
import { requireAuth } from '../middleware/auth.js';
import { syncApprovedClaimsRecovery } from '../utils/claimRecovery.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await syncApprovedClaimsRecovery();
    const { kind, category, status, q, limit = 100 } = req.query;
    const filter = {};

    if (kind) filter.kind = kind;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (q) {
      const escaped = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
        { brand: regex },
      ];
    }

    const maxLimit = Math.min(Number(limit) || 100, 500);
    const items = await Item.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(maxLimit);

    res.json({ success: true, data: items.map(formatItem) });
  } catch (err) {
    console.error('List items error:', err);
    res.status(500).json({ success: false, message: 'Failed to load items.' });
  }
});

router.get('/my/:userId', requireAuth, async (req, res) => {
  try {
    await syncApprovedClaimsRecovery();
    const requestedId = req.params.userId;
    if (String(requestedId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    if (!mongoose.isValidObjectId(requestedId)) {
      return res.json({ success: true, data: [] });
    }

    const items = await Item.find({ user: requestedId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: items.map(formatItem) });
  } catch (err) {
    console.error('Get my items by id error:', err);
    res.status(500).json({ success: false, message: 'Failed to load items.' });
  }
});

router.get('/my', requireAuth, async (req, res) => {
  try {
    await syncApprovedClaimsRecovery();
    const items = await Item.find({ user: req.user._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: items.map(formatItem) });
  } catch (err) {
    console.error('Get my items error:', err);
    res.status(500).json({ success: false, message: 'Failed to load items.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const item = await Item.findById(req.params.id).populate('user', 'name email');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    res.json({ success: true, data: formatItem(item) });
  } catch (err) {
    console.error('Get item error:', err);
    res.status(500).json({ success: false, message: 'Failed to load item.' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.kind || !b.title || !b.category) {
      return res.status(400).json({
        success: false,
        message: 'Kind, title and category are required.',
      });
    }

    const item = await Item.create({
      user: req.user._id,
      kind: b.kind,
      title: String(b.title).trim(),
      category: String(b.category).trim(),
      description: b.description || '',
      colour: b.colour || b.color || '—',
      brand: b.brand || '—',
      location: b.location || '',
      item_date: b.date || b.item_date || null,
      item_time: b.time || b.item_time || null,
      details: b.details || '',
      image: b.image || '',
      image_preview: b.imagePreview || b.image_preview || '',
      status: b.status || (b.kind === 'lost' ? 'Active' : 'Reported'),
    });

    await item.populate('user', 'name email');
    res.status(201).json({ success: true, data: formatItem(item) });
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ success: false, message: 'Failed to create item.' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (String(item.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const b = req.body || {};
    if (b.title !== undefined) item.title = b.title;
    if (b.category !== undefined) item.category = b.category;
    if (b.description !== undefined) item.description = b.description;
    if (b.colour !== undefined || b.color !== undefined) item.colour = b.colour || b.color;
    if (b.brand !== undefined) item.brand = b.brand;
    if (b.location !== undefined) item.location = b.location;
    if (b.date !== undefined || b.item_date !== undefined) item.item_date = b.date || b.item_date;
    if (b.time !== undefined || b.item_time !== undefined) item.item_time = b.time || b.item_time;
    if (b.details !== undefined) item.details = b.details;
    if (b.image !== undefined) item.image = b.image;
    if (b.imagePreview !== undefined || b.image_preview !== undefined) {
      item.image_preview = b.imagePreview || b.image_preview;
    }
    if (b.status !== undefined) item.status = b.status;

    await item.save();
    await item.populate('user', 'name email');

    res.json({ success: true, data: formatItem(item) });
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ success: false, message: 'Failed to update item.' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (String(item.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete item.' });
  }
});

export default router;
