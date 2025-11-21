// VIP Model Schema for lowdb/MongoDB
export const VIPSchema = {
  userId: { type: Number, required: true, unique: true },
  package: { type: String, enum: ["vip_7", "vip_30", "vip_365"], required: true },
  expiresAt: { type: Date, required: true },
  purchaseDate: { type: Date, default: new Date() },
  price: { type: Number },
  status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  renewalCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: new Date() },
  updatedAt: { type: Date, default: new Date() }
};

export default VIPSchema;
