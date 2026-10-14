const itemModel = require('../models/itemModel');
const notificationModel = require('../models/notificationModel');
const { buildMatchCatalogue } = require('../utils/matchEngine');

async function listItems(req, res) {
  try {
    const { kind, category, location, status, search, userId, limit = 100, offset = 0 } = req.query;
    const items = await itemModel.listItems({ kind, category, location, status, search, userId, limit, offset });
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('List items error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch items', error: err.message });
  }
}

async function getItem(req, res) {
  try {
    const item = await itemModel.getItemById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch item' });
  }
}

async function createItem(req, res) {
  try {
    const { kind, title, category, description, colour, brand, location, date, time, image, imagePreview, details, status, secretQuestion, secretAnswer } = req.body;
    if (!kind || !title || !category || !description || !location || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields: kind, title, category, description, location, date' });
    }
    if (!['lost','found'].includes(kind)) {
      return res.status(400).json({ success: false, message: 'Kind must be lost or found' });
    }

    const item = await itemModel.createItem({
      kind,
      user_id: req.user.id,
      title: title.trim(),
      category,
      description: description.trim(),
      colour: colour || '—',
      brand: brand || '—',
      location: location.trim(),
      date,
      time: time || null,
      image: image || '',
      image_preview: imagePreview || req.body.image_preview || '',
      details: details || '',
      status: status || (kind === 'lost' ? 'Active' : 'Reported'),
      secret_question: secretQuestion || null,
      secret_answer: secretAnswer || null,
    });

    // Try to generate match notifications asynchronously
    try {
      const allLost = await itemModel.listItems({ kind: 'lost', limit: 200 });
      const allFound = await itemModel.listItems({ kind: 'found', limit: 200 });
      const matches = buildMatchCatalogue(allLost, allFound, null, 70);
      // Find matches involving this new item with high score
      const relevant = matches.filter(m => String(m.lostItemId) === String(item.id) || String(m.foundItemId) === String(item.id));
      for (const mm of relevant.slice(0,3)) {
        const ownerId = mm.lostItem.userId;
        if (ownerId && String(ownerId) !== String(req.user.id)) {
          await notificationModel.createMatchNotification(ownerId, mm.lostItem.title, mm.foundItem.title, mm.score, mm.foundItem.location);
        }
      }
    } catch (e) {
      console.warn('Match notification generation failed:', e.message);
    }

    res.status(201).json({ success: true, message: 'Item reported successfully', data: item });
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ success: false, message: 'Failed to create item', error: err.message });
  }
}

async function updateItem(req, res) {
  try {
    const existing = await itemModel.getItemById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Item not found' });
    if (String(existing.userId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this item' });
    }
    const patch = {};
    const fields = ['title','category','description','colour','brand','location','date','time','image','imagePreview','image_preview','details','status','secretQuestion','secretAnswer'];
    const colMap = { imagePreview: 'image_preview', secretQuestion: 'secret_question', secretAnswer: 'secret_answer' };
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        const col = colMap[f] || f;
        patch[col] = req.body[f];
      }
    }
    const updated = await itemModel.updateItem(req.params.id, patch);
    res.json({ success: true, message: 'Item updated', data: updated });
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
}

async function deleteItem(req, res) {
  try {
    const existing = await itemModel.getItemById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Item not found' });
    if (String(existing.userId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this item' });
    }
    const ok = await itemModel.deleteItem(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
}

async function myItems(req, res) {
  try {
    const userId = req.params.userId || req.user.id;
    if (String(userId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const items = await itemModel.getItemsByUser(userId);
    const lost = items.filter(i => i.kind === 'lost');
    const found = items.filter(i => i.kind === 'found');
    res.json({ success: true, data: { all: items, lost, found } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch my items' });
  }
}

module.exports = { listItems, getItem, createItem, updateItem, deleteItem, myItems };
