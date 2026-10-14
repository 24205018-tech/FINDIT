import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    contextType: {
      type: String,
      enum: ['match', 'claim'],
      required: true,
      default: 'match',
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      default: null,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
    contextTitle: {
      type: String,
      default: '',
      trim: true,
    },
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      createdAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

export function formatConversation(c, currentUserId = null) {
  if (!c) return null;
  const obj = c.toObject ? c.toObject({ virtuals: true }) : c;
  const id = obj._id ? obj._id.toString() : (obj.id || '');

  let participants = [];
  let otherUser = null;

  if (Array.isArray(obj.participants)) {
    participants = obj.participants.map((p) => {
      if (p && typeof p === 'object') {
        const pId = p._id ? p._id.toString() : (p.id || '');
        const pData = {
          id: pId,
          _id: pId,
          name: p.name || 'User',
          email: p.email || '',
          role: p.role || 'student',
          department: p.department || '',
          designation: p.designation || '',
          photo: p.photo || '',
        };
        if (currentUserId && pId !== String(currentUserId) && !otherUser) {
          otherUser = pData;
        }
        return pData;
      }
      const strId = String(p);
      if (currentUserId && strId !== String(currentUserId) && !otherUser) {
        otherUser = { id: strId, _id: strId, name: 'User' };
      }
      return { id: strId, _id: strId };
    });
  }

  if (!otherUser && participants.length > 0) {
    otherUser = participants.find((p) => p.id !== String(currentUserId)) || participants[0];
  }

  const lastMsg = obj.lastMessage
    ? {
        text: obj.lastMessage.text || '',
        sender: obj.lastMessage.sender?._id
          ? obj.lastMessage.sender._id.toString()
          : (obj.lastMessage.sender ? obj.lastMessage.sender.toString() : null),
        createdAt: obj.lastMessage.createdAt || obj.updatedAt || obj.createdAt,
      }
    : null;

  return {
    id,
    _id: id,
    participants,
    otherUser: otherUser || { id: '', name: 'Participant' },
    contextType: obj.contextType || 'match',
    contextTitle: obj.contextTitle || '',
    matchId: obj.match?._id ? obj.match._id.toString() : (obj.match ? obj.match.toString() : null),
    claimId: obj.claim?._id ? obj.claim._id.toString() : (obj.claim ? obj.claim.toString() : null),
    itemId: obj.item?._id ? obj.item._id.toString() : (obj.item ? obj.item.toString() : null),
    match: obj.match || null,
    claim: obj.claim || null,
    item: obj.item || null,
    lastMessage: lastMsg,
    unreadCount: typeof obj.unreadCount === 'number' ? obj.unreadCount : 0,
    createdAt: obj.createdAt || obj.created_at,
    updatedAt: obj.updatedAt || obj.updated_at,
  };
}

export const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
