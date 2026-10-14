import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      default: 'info',
      maxlength: 60,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.userId = doc.user?._id ? doc.user._id.toString() : (doc.user ? doc.user.toString() : '');
        ret.user_id = ret.userId;
        ret.read = ret.is_read;
        ret.isRead = ret.is_read;
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.userId = doc.user?._id ? doc.user._id.toString() : (doc.user ? doc.user.toString() : '');
        ret.user_id = ret.userId;
        ret.read = ret.is_read;
        ret.isRead = ret.is_read;
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        return ret;
      },
    },
  }
);

export function formatNotification(n) {
  if (!n) return null;
  const obj = n.toObject ? n.toObject({ virtuals: true }) : n;
  const id = obj._id ? obj._id.toString() : (obj.id || '');
  const userId = obj.user?._id ? obj.user._id.toString() : (obj.user ? obj.user.toString() : (obj.userId || obj.user_id || ''));
  const isRead = Boolean(obj.is_read ?? obj.read ?? obj.isRead);
  const createdAt = obj.createdAt || obj.created_at || new Date().toISOString();

  return {
    ...obj,
    id,
    _id: obj._id || id,
    userId,
    user_id: userId,
    type: obj.type || 'info',
    message: obj.message || '',
    read: isRead,
    isRead,
    is_read: isRead,
    createdAt,
    created_at: createdAt,
  };
}

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
