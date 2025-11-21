// Banned Model Schema for lowdb/MongoDB
export const BannedSchema = {
  groupId: { type: Number, required: true },
  userId: { type: Number, required: true },
  reason: { type: String },
  bannedBy: { type: Number },
  bannedAt: { type: Date, default: new Date() },
  expiresAt: { type: Date }, // null = permanent
  status: { type: String, enum: ["active", "expired", "unbanned"], default: "active" },
  createdAt: { type: Date, default: new Date() },
  updatedAt: { type: Date, default: new Date() }
};

export default BannedSchema;
