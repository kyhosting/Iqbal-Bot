// User Model Schema for lowdb/MongoDB
export const UserSchema = {
  userId: { type: Number, required: true, unique: true },
  username: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String, enum: ["user", "vip", "admin", "owner"], default: "user" },
  status: { type: String, enum: ["active", "inactive", "banned"], default: "active" },
  lastSeen: { type: Date, default: new Date() },
  totalOperations: { type: Number, default: 0 },
  createdAt: { type: Date, default: new Date() },
  updatedAt: { type: Date, default: new Date() }
};

export default UserSchema;
