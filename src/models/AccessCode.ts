import mongoose from 'mongoose';

const AccessCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  label: { type: String },
  inUse: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.AccessCode) {
  delete mongoose.models.AccessCode;
}

export default mongoose.model('AccessCode', AccessCodeSchema);
