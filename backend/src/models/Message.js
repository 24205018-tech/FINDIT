import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: 3000,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ recipient: 1, read: 1 });

export function formatMessage(m) {
  if (!m) return null;
  const obj = m.toObject ? m.toObject({ virtuals: true }) : m;
  const id = obj._id ? obj._id.toString() : (obj.id || '');
  const senderId = obj.sender?._id ? obj.sender._id.toString() : (obj.sender ? obj.sender.toString() : '');
  const recipientId = obj.recipient?._id ? obj.recipient._id.toString() : (obj.recipient ? obj.recipient.toString() : '');
  const conversationId = obj.conversation?._id ? obj.conversation._id.toString() : (obj.conversation ? obj.conversation.toString() : '');

  const senderName = obj.sender?.name || '';
  const senderEmail = obj.sender?.email || '';
  const senderPhoto = obj.sender?.photo || '';

  return {
    id,
    _id: id,
    conversationId,
    conversation: conversationId,
    senderId,
    recipientId,
    sender:
      typeof obj.sender === 'object' && obj.sender
        ? {
            id: senderId,
            name: senderName,
            email: senderEmail,
            photo: senderPhoto,
          }
        : senderId,
    text: obj.text,
    read: Boolean(obj.read),
    readAt: obj.readAt || null,
    createdAt: obj.createdAt || obj.created_at,
    updatedAt: obj.updatedAt || obj.updated_at,
  };
}

export const Message = mongoose.model('Message', messageSchema);
export default Message;
