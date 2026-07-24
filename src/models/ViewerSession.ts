import mongoose from 'mongoose';

const ViewerSessionSchema = new mongoose.Schema({
  accessCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessCode', required: true },
  sessionToken: { type: String, required: true, unique: true },
  lastHeartbeat: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ViewerSession || mongoose.model('ViewerSession', ViewerSessionSchema);
