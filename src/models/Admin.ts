import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['master', 'admin'], default: 'admin' },
  label: { type: String },
  inUse: { type: Boolean, default: false },
  sessionToken: { type: String },
  lastHeartbeat: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.Admin) {
  delete mongoose.models.Admin;
}

export default mongoose.model('Admin', AdminSchema);
