import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 190,
      index: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
      maxlength: 30,
    },
    password_hash: {
      type: String,
      default: '',
    },
    google_id: {
      type: String,
      default: '',
      index: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
      index: true,
    },
    department: {
      type: String,
      default: 'General',
      trim: true,
      maxlength: 120,
    },
    designation: {
      type: String,
      default: 'Student',
      trim: true,
      maxlength: 120,
    },
    photo: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        return ret;
      },
    },
  }
);

userSchema.virtual('created_at').get(function () {
  return this.createdAt;
});

userSchema.virtual('updated_at').get(function () {
  return this.updatedAt;
});

export const User = mongoose.model('User', userSchema);
export default User;
