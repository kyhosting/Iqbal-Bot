// Warn Model Schema for lowdb/MongoDB
export const WarnSchema = {
  groupId: { type: Number, required: true },
  userId: { type: Number, required: true },
  count: { type: Number, default: 0 },
  warns: { 
    type: Array,
    default: [],
    items: {
      reason: String,
      timestamp: Date,
      admin: Number
    }
  },
  lastWarnDate: { type: Date },
  createdAt: { type: Date, default: new Date() },
  updatedAt: { type: Date, default: new Date() }
};

export default WarnSchema;
