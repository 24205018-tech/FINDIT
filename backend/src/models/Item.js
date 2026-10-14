import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['lost', 'found'],
      required: [true, 'Item kind (lost/found) is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 180,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: 100,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    colour: {
      type: String,
      default: '—',
      maxlength: 80,
    },
    brand: {
      type: String,
      default: '—',
      maxlength: 100,
    },
    location: {
      type: String,
      default: '',
      trim: true,
      maxlength: 180,
      index: true,
    },
    item_date: {
      type: String,
      default: null,
    },
    item_time: {
      type: String,
      default: null,
    },
    details: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    image_preview: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Active',
      index: true,
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
        ret.date = ret.item_date;
        ret.time = ret.item_time;
        ret.imagePreview = ret.image_preview;
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        if (doc.user && typeof doc.user === 'object' && doc.user.name) {
          ret.reporterName = doc.user.name;
          ret.reporterEmail = doc.user.email;
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.userId = doc.user?._id ? doc.user._id.toString() : (doc.user ? doc.user.toString() : '');
        ret.user_id = ret.userId;
        ret.date = ret.item_date;
        ret.time = ret.item_time;
        ret.imagePreview = ret.image_preview;
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        if (doc.user && typeof doc.user === 'object' && doc.user.name) {
          ret.reporterName = doc.user.name;
          ret.reporterEmail = doc.user.email;
        }
        return ret;
      },
    },
  }
);

itemSchema.virtual('userId').get(function () {
  return this.user?._id ? this.user._id.toString() : (this.user ? this.user.toString() : '');
});

itemSchema.virtual('user_id').get(function () {
  return this.userId;
});

itemSchema.virtual('date').get(function () {
  return this.item_date;
});

itemSchema.virtual('time').get(function () {
  return this.item_time;
});

itemSchema.virtual('imagePreview').get(function () {
  return this.image_preview;
});

itemSchema.virtual('created_at').get(function () {
  return this.createdAt;
});

itemSchema.virtual('updated_at').get(function () {
  return this.updatedAt;
});

itemSchema.virtual('reporterName').get(function () {
  return this.user && typeof this.user === 'object' ? this.user.name : '';
});

itemSchema.virtual('reporterEmail').get(function () {
  return this.user && typeof this.user === 'object' ? this.user.email : '';
});

export function formatItem(item) {
  if (!item) return null;
  const obj = item.toObject ? item.toObject({ virtuals: true }) : item;
  const id = obj._id ? obj._id.toString() : (obj.id || '');
  const userId = obj.user?._id ? obj.user._id.toString() : (obj.user ? obj.user.toString() : (obj.userId || obj.user_id || ''));
  const reporterName = obj.user?.name || obj.reporterName || '';
  const reporterEmail = obj.user?.email || obj.reporterEmail || '';
  const createdAt = obj.createdAt || obj.created_at || new Date().toISOString();
  const updatedAt = obj.updatedAt || obj.updated_at || createdAt;

  return {
    ...obj,
    id,
    _id: obj._id || id,
    userId,
    user_id: userId,
    date: obj.item_date || obj.date || null,
    time: obj.item_time || obj.time || null,
    item_date: obj.item_date || obj.date || null,
    item_time: obj.item_time || obj.time || null,
    imagePreview: obj.image_preview || obj.imagePreview || '',
    image_preview: obj.image_preview || obj.imagePreview || '',
    reporterName,
    reporterEmail,
    createdAt,
    updatedAt,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export const Item = mongoose.model('Item', itemSchema);
export default Item;
