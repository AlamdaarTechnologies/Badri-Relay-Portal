import mongoose from 'mongoose';

const LiveStreamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  streamKey: { type: String, required: true, unique: true },
  type: { type: String, enum: ['rtmp', 'external'], default: 'rtmp' },
  externalUrl: { type: String },
  isVisible: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.LiveStream) {
  delete mongoose.models.LiveStream;
}

export default mongoose.model('LiveStream', LiveStreamSchema);
