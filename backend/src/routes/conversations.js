import { Router } from 'express';
import mongoose from 'mongoose';
import { Conversation, formatConversation } from '../models/Conversation.js';
import { Message, formatMessage } from '../models/Message.js';
import { Match } from '../models/Match.js';
import { Claim } from '../models/Claim.js';
import { Item } from '../models/Item.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/**
 * Helper to verify that current user and recipient are participants
 * in a valid lost/found match or related claim.
 */
async function verifyMessagingEligibility({ currentUserId, recipientId, matchId, claimId, itemId }) {
  const current = currentUserId.toString();
  const recipient = recipientId.toString();

  if (current === recipient) {
    return { eligible: false, message: 'You cannot start a conversation with yourself.' };
  }

  // 1. Verify against provided matchId
  if (matchId) {
    if (mongoose.isValidObjectId(matchId)) {
      const match = await Match.findById(matchId).populate('lost_item found_item');
      if (match) {
        const p1 = match.lost_user?.toString() || match.lost_item?.user?.toString();
        const p2 = match.found_user?.toString() || match.found_item?.user?.toString();
        if ((p1 === current && p2 === recipient) || (p1 === recipient && p2 === current)) {
          return {
            eligible: true,
            contextType: 'match',
            match,
            item: match.lost_item || match.found_item,
            contextTitle: match.lost_item?.title ? `Match: ${match.lost_item.title}` : 'Smart Match',
          };
        }
      }
    } else if (typeof matchId === 'string' && matchId.includes('_')) {
      // Support synthetic match ids composed of lostItemId_foundItemId
      const [id1, id2] = matchId.split('_');
      if (mongoose.isValidObjectId(id1) && mongoose.isValidObjectId(id2)) {
        const item1 = await Item.findById(id1);
        const item2 = await Item.findById(id2);
        if (item1 && item2) {
          const u1 = item1.user?.toString();
          const u2 = item2.user?.toString();
          if ((u1 === current && u2 === recipient) || (u1 === recipient && u2 === current)) {
            const lostItem = item1.kind === 'lost' ? item1 : item2;
            const foundItem = item1.kind === 'found' ? item1 : item2;
            let matchDoc = await Match.findOne({ lost_item: lostItem._id, found_item: foundItem._id });
            if (!matchDoc) {
              matchDoc = await Match.create({
                lost_item: lostItem._id,
                found_item: foundItem._id,
                lost_user: lostItem.user,
                found_user: foundItem.user,
                score: 75,
                status: 'potential',
              }).catch(() => null);
            }
            return {
              eligible: true,
              contextType: 'match',
              match: matchDoc,
              item: lostItem,
              contextTitle: `Match: ${lostItem.title}`,
            };
          }
        }
      }
    }
  }

  // 2. Verify against provided claimId
  if (claimId && mongoose.isValidObjectId(claimId)) {
    const claim = await Claim.findById(claimId).populate('item');
    if (claim) {
      const claimant = claim.user?.toString();
      const poster = claim.item?.user?.toString();
      if ((claimant === current && poster === recipient) || (claimant === recipient && poster === current)) {
        return {
          eligible: true,
          contextType: 'claim',
          claim,
          item: claim.item,
          contextTitle: `Claim: ${claim.item?.title || 'Item Claim'}`,
        };
      }
    }
  }

  // 3. Verify against provided itemId (e.g. claim or report context)
  if (itemId && mongoose.isValidObjectId(itemId)) {
    const item = await Item.findById(itemId);
    if (item) {
      const poster = item.user?.toString();
      // Check if a claim on this item connects current and recipient
      const claim = await Claim.findOne({
        item: item._id,
        $or: [
          { user: currentUserId },
          { user: recipientId },
        ],
      });
      if (claim) {
        const claimant = claim.user?.toString();
        if ((claimant === current && poster === recipient) || (claimant === recipient && poster === current)) {
          return {
            eligible: true,
            contextType: 'claim',
            claim,
            item,
            contextTitle: `Claim: ${item.title}`,
          };
        }
      }
    }
  }

  // 4. Check for any existing Match document connecting these two users
  const existingMatch = await Match.findOne({
    $or: [
      { lost_user: currentUserId, found_user: recipientId },
      { lost_user: recipientId, found_user: currentUserId },
    ],
  }).populate('lost_item found_item');
  if (existingMatch) {
    return {
      eligible: true,
      contextType: 'match',
      match: existingMatch,
      item: existingMatch.lost_item || existingMatch.found_item,
      contextTitle: existingMatch.lost_item?.title ? `Match: ${existingMatch.lost_item.title}` : 'Smart Match',
    };
  }

  // 5. Check for any Claim connecting these two users
  const recipientItems = await Item.find({ user: recipientId }).select('_id title');
  if (recipientItems.length > 0) {
    const claimByUser = await Claim.findOne({
      user: currentUserId,
      item: { $in: recipientItems.map((i) => i._id) },
    }).populate('item');
    if (claimByUser) {
      return {
        eligible: true,
        contextType: 'claim',
        claim: claimByUser,
        item: claimByUser.item,
        contextTitle: `Claim: ${claimByUser.item?.title || 'Item Claim'}`,
      };
    }
  }

  const userItems = await Item.find({ user: currentUserId }).select('_id title');
  if (userItems.length > 0) {
    const claimByRecipient = await Claim.findOne({
      user: recipientId,
      item: { $in: userItems.map((i) => i._id) },
    }).populate('item');
    if (claimByRecipient) {
      return {
        eligible: true,
        contextType: 'claim',
        claim: claimByRecipient,
        item: claimByRecipient.item,
        contextTitle: `Claim: ${claimByRecipient.item?.title || 'Item Claim'}`,
      };
    }
  }

  // 6. Check if items between them form a valid active lost/found match (same category)
  const lostByUser = await Item.find({ user: currentUserId, kind: 'lost', status: { $ne: 'Closed' } });
  const foundByRecipient = await Item.find({ user: recipientId, kind: 'found', status: { $ne: 'Closed' } });
  let itemMatchPair = null;
  for (const l of lostByUser) {
    for (const f of foundByRecipient) {
      if (l.category && f.category && l.category.toLowerCase() === f.category.toLowerCase()) {
        itemMatchPair = { lost: l, found: f };
        break;
      }
    }
    if (itemMatchPair) break;
  }

  if (!itemMatchPair) {
    const foundByUser = await Item.find({ user: currentUserId, kind: 'found', status: { $ne: 'Closed' } });
    const lostByRecipient = await Item.find({ user: recipientId, kind: 'lost', status: { $ne: 'Closed' } });
    for (const f of foundByUser) {
      for (const l of lostByRecipient) {
        if (l.category && f.category && l.category.toLowerCase() === f.category.toLowerCase()) {
          itemMatchPair = { lost: l, found: f };
          break;
        }
      }
      if (itemMatchPair) break;
    }
  }

  if (itemMatchPair) {
    let matchDoc = await Match.findOne({ lost_item: itemMatchPair.lost._id, found_item: itemMatchPair.found._id });
    if (!matchDoc) {
      matchDoc = await Match.create({
        lost_item: itemMatchPair.lost._id,
        found_item: itemMatchPair.found._id,
        lost_user: itemMatchPair.lost.user,
        found_user: itemMatchPair.found.user,
        score: 75,
        status: 'potential',
      }).catch(() => null);
    }
    return {
      eligible: true,
      contextType: 'match',
      match: matchDoc,
      item: itemMatchPair.lost,
      contextTitle: `Match: ${itemMatchPair.lost.title}`,
    };
  }

  return {
    eligible: false,
    message: 'Users may start a conversation only when they are participants in a valid lost/found match or related claim.',
  };
}

/**
 * GET /api/conversations
 * List all conversations for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const list = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name email role department designation photo')
      .populate('match')
      .populate('claim')
      .populate('item', 'title category location kind')
      .sort({ updatedAt: -1 });

    const formatted = await Promise.all(
      list.map(async (c) => {
        const unreadCount = await Message.countDocuments({
          conversation: c._id,
          recipient: req.user._id,
          read: false,
        });
        const convObj = formatConversation(c, req.user._id);
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ success: false, message: 'Failed to load conversations.' });
  }
});

/**
 * GET /api/conversations/unread-count
 * Quick total unread messages count for current user
 */
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ success: true, count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ success: false, message: 'Failed to get unread count.' });
  }
});

/**
 * GET /api/conversations/:id
 * Retrieve a single conversation
 */
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name email role department designation photo')
      .populate('match')
      .populate('claim')
      .populate('item', 'title category location kind');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isParticipant = conversation.participants.some(
      (p) => (p._id ? p._id.toString() : p.toString()) === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not a participant in this conversation.' });
    }

    const unreadCount = await Message.countDocuments({
      conversation: conversation._id,
      recipient: req.user._id,
      read: false,
    });

    const formatted = formatConversation(conversation, req.user._id);
    formatted.unreadCount = unreadCount;

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ success: false, message: 'Failed to load conversation.' });
  }
});

/**
 * GET /api/conversations/:id/messages
 * List messages in a conversation and mark received messages as read
 */
router.get('/:id/messages', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isParticipant = conversation.participants.some(
      (p) => (p._id ? p._id.toString() : p.toString()) === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not a participant in this conversation.' });
    }

    // Mark unread messages sent to current user as read
    await Message.updateMany(
      { conversation: conversation._id, recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name email photo')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages.map(formatMessage) });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ success: false, message: 'Failed to load messages.' });
  }
});

/**
 * POST /api/conversations
 * Start or retrieve a conversation between participants of a match or claim
 */
router.post('/', async (req, res) => {
  try {
    const { recipientId, matchId, claimId, itemId, initialMessage } = req.body || {};

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient is required.' });
    }

    if (!mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({ success: false, message: 'Invalid recipient ID.' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient user not found.' });
    }

    // Strict eligibility check: Must be participants in a valid lost/found match or related claim
    const eligibility = await verifyMessagingEligibility({
      currentUserId: req.user._id,
      recipientId,
      matchId,
      claimId,
      itemId,
    });

    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        message:
          eligibility.message ||
          'Users may start a conversation only when they are participants in a valid lost/found match or related claim.',
      });
    }

    // Search for existing conversation between these users
    const query = {
      participants: { $all: [req.user._id, recipientId] },
    };

    if (eligibility.match?._id) {
      query.match = eligibility.match._id;
    } else if (eligibility.claim?._id) {
      query.claim = eligibility.claim._id;
    }

    let conversation = await Conversation.findOne(query)
      .populate('participants', 'name email role department designation photo')
      .populate('match')
      .populate('claim')
      .populate('item', 'title category location kind');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        contextType: eligibility.contextType,
        match: eligibility.match?._id || null,
        claim: eligibility.claim?._id || null,
        item: eligibility.item?._id || null,
        contextTitle: eligibility.contextTitle || 'Smart Match',
        lastMessage: initialMessage
          ? {
              text: String(initialMessage).trim(),
              sender: req.user._id,
              createdAt: new Date(),
            }
          : undefined,
      });

      await conversation.populate('participants', 'name email role department designation photo');
      await conversation.populate('match');
      await conversation.populate('claim');
      await conversation.populate('item', 'title category location kind');
    }

    // If an initial message was supplied, create the Message document
    if (initialMessage && String(initialMessage).trim()) {
      const text = String(initialMessage).trim();
      await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        recipient: recipientId,
        text,
      });

      conversation.lastMessage = {
        text,
        sender: req.user._id,
        createdAt: new Date(),
      };
      await conversation.save();

      // Trigger notification for recipient
      await Notification.create({
        user: recipientId,
        type: 'message',
        message: `New message from ${req.user.name}: "${text.slice(0, 50)}${text.length > 50 ? '…' : ''}"`,
      }).catch(() => null);
    }

    const formatted = formatConversation(conversation, req.user._id);
    formatted.unreadCount = await Message.countDocuments({
      conversation: conversation._id,
      recipient: req.user._id,
      read: false,
    });

    res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ success: false, message: 'Failed to start conversation.' });
  }
});

/**
 * POST /api/conversations/:id/messages
 * Send a message within a conversation
 */
router.post('/:id/messages', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const text = req.body?.text ? String(req.body.text).trim() : '';
    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const currentStr = req.user._id.toString();
    const isParticipant = conversation.participants.some(
      (p) => (p._id ? p._id.toString() : p.toString()) === currentStr
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this conversation.' });
    }

    const recipientObj = conversation.participants.find(
      (p) => (p._id ? p._id.toString() : p.toString()) !== currentStr
    );

    const recipientId = recipientObj?._id ? recipientObj._id.toString() : recipientObj?.toString();

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient not found in conversation.' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      recipient: recipientId,
      text,
    });

    conversation.lastMessage = {
      text,
      sender: req.user._id,
      createdAt: new Date(),
    };
    conversation.updatedAt = new Date();
    await conversation.save();

    await message.populate('sender', 'name email photo');

    // Trigger notification
    await Notification.create({
      user: recipientId,
      type: 'message',
      message: `New message from ${req.user.name}: "${text.slice(0, 50)}${text.length > 50 ? '…' : ''}"`,
    }).catch(() => null);

    res.status(201).json({ success: true, data: formatMessage(message) });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

/**
 * PATCH /api/conversations/:id/read
 * Mark messages in a conversation as read for current user
 */
router.patch('/:id/read', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const currentStr = req.user._id.toString();
    const isParticipant = conversation.participants.some(
      (p) => (p._id ? p._id.toString() : p.toString()) === currentStr
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    await Message.updateMany(
      { conversation: conversation._id, recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark messages as read.' });
  }
});

export default router;
