import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    item_kind: {
      type: String,
      default: 'found',
      maxlength: 20,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
    },
    hidden_detail: {
      type: String,
      default: '',
    },
    additional_info: {
      type: String,
      default: '',
    },
    proof_name: {
      type: String,
      default: '',
      maxlength: 180,
    },
    proof_preview: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Under Review'],
      default: 'Pending',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.itemId = doc.item?._id ? doc.item._id.toString() : (doc.item ? doc.item.toString() : '');
        ret.item_id = ret.itemId;
        ret.userId = doc.user?._id ? doc.user._id.toString() : (doc.user ? doc.user.toString() : '');
        ret.user_id = ret.userId;
        ret.itemKind = ret.item_kind;
        ret.hiddenDetail = ret.hidden_detail;
        ret.additionalInfo = ret.additional_info;
        ret.proofName = ret.proof_name;
        ret.proofPreview = ret.proof_preview;
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        if (doc.item && typeof doc.item === 'object') {
          ret.itemTitle = doc.item.title || '';
          ret.itemCategory = doc.item.category || '';
          ret.itemLocation = doc.item.location || '';
        }
        if (doc.user && typeof doc.user === 'object') {
          ret.claimantName = doc.user.name || '';
          ret.claimantEmail = doc.user.email || '';
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.itemId = doc.item?._id ? doc.item._id.toString() : (doc.item ? doc.item.toString() : '');
        ret.item_id = ret.itemId;
        ret.userId = doc.user?._id ? doc.user._id.toString() : (doc.user ? doc.user.toString() : '');
        ret.user_id = ret.userId;
        ret.itemKind = ret.item_kind;
        ret.hiddenDetail = ret.hidden_detail;
        ret.additionalInfo = ret.additional_info;
        ret.proofName = ret.proof_name;
        ret.proofPreview = ret.proof_preview;
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        if (doc.item && typeof doc.item === 'object') {
          ret.itemTitle = doc.item.title || '';
          ret.itemCategory = doc.item.category || '';
          ret.itemLocation = doc.item.location || '';
        }
        if (doc.user && typeof doc.user === 'object') {
          ret.claimantName = doc.user.name || '';
          ret.claimantEmail = doc.user.email || '';
        }
        return ret;
      },
    },
  }
);

claimSchema.virtual('itemId').get(function () {
  return this.item?._id ? this.item._id.toString() : (this.item ? this.item.toString() : '');
});

claimSchema.virtual('userId').get(function () {
  return this.user?._id ? this.user._id.toString() : (this.user ? this.user.toString() : '');
});

export function formatClaim(claim) {
  if (!claim) return null;
  const obj = claim.toObject ? claim.toObject({ virtuals: true }) : claim;
  const id = obj._id ? obj._id.toString() : (obj.id || '');
  const itemId = obj.item?._id ? obj.item._id.toString() : (obj.item ? obj.item.toString() : (obj.itemId || obj.item_id || ''));
  const userId = obj.user?._id ? obj.user._id.toString() : (obj.user ? obj.user.toString() : (obj.userId || obj.user_id || ''));
  const itemTitle = obj.item?.title || obj.itemTitle || '';
  const itemCategory = obj.item?.category || obj.itemCategory || '';
  const itemLocation = obj.item?.location || obj.itemLocation || '';
  const claimantName = obj.user?.name || obj.claimantName || '';
  const claimantEmail = obj.user?.email || obj.claimantEmail || '';
  const createdAt = obj.createdAt || obj.created_at || new Date().toISOString();
  const updatedAt = obj.updatedAt || obj.updated_at || createdAt;

  return {
    ...obj,
    id,
    _id: obj._id || id,
    itemId,
    item_id: itemId,
    userId,
    user_id: userId,
    itemKind: obj.item_kind || obj.itemKind || 'found',
    item_kind: obj.item_kind || obj.itemKind || 'found',
    reason: obj.reason,
    hiddenDetail: obj.hidden_detail || obj.hiddenDetail || '',
    hidden_detail: obj.hidden_detail || obj.hiddenDetail || '',
    additionalInfo: obj.additional_info || obj.additionalInfo || '',
    additional_info: obj.additional_info || obj.additionalInfo || '',
    proofName: obj.proof_name || obj.proofName || '',
    proof_name: obj.proof_name || obj.proofName || '',
    proofPreview: obj.proof_preview || obj.proofPreview || '',
    proof_preview: obj.proof_preview || obj.proofPreview || '',
    status: obj.status || 'Pending',
    itemTitle,
    itemCategory,
    itemLocation,
    claimantName,
    claimantEmail,
    createdAt,
    updatedAt,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export const Claim = mongoose.model('Claim', claimSchema);
export default Claim;
