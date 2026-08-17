const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a room name'],
      unique: true,
      trim: true,
      minlength: [2, 'Room name must be at least 2 characters'],
      maxlength: [100, 'Room name cannot exceed 100 characters'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Room description cannot exceed 200 characters'],
      default: '',
    },
    topic: {
      type: String,
      trim: true,
      maxlength: [100, 'Topic cannot exceed 100 characters'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system/default rooms
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isDirect: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: 'MessageSquare',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for member count
roomSchema.virtual('memberCount').get(function () {
  return this.members ? this.members.length : 0;
});

module.exports = mongoose.model('Room', roomSchema);
