// GroupSetting Model Schema for lowdb/MongoDB
export const GroupSettingSchema = {
  groupId: { type: Number, required: true, unique: true },
  name: { type: String },
  welcome: { type: Boolean, default: true },
  welcomeMessage: { type: String },
  antiLink: { type: Boolean, default: true },
  antiVirtex: { type: Boolean, default: true },
  autoDelete: { type: Boolean, default: true },
  messageLimitForDelete: { type: Number, default: 1000 },
  banSystem: { type: Boolean, default: true },
  warnSystem: { type: Boolean, default: true },
  vipWhitelist: { type: Array, default: [] },
  admins: { type: Array, default: [] },
  createdAt: { type: Date, default: new Date() },
  updatedAt: { type: Date, default: new Date() }
};

export default GroupSettingSchema;
