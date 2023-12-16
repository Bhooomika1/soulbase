import { Schema, model, models } from 'mongoose';

const ReplyingToSchema = new Schema({
  cid: {
    type: String,
    required: true,
    immutable: true,
  },
  address: {
    type: String,
    required: true,
    immutable: true,
  },
}, { _id: false });

const PostSchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
    immutable: true,
  },
  cid: {
    type: String,
    required: [true, 'cid is required'],
    immutable: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  replyingTo: [ReplyingToSchema],
  blockchain: {
    type: String,
    required: [true, 'Blockchain is required'],
    enum: [
      'Polygon zkEVM Testnet',
      'Arbitrum Goerli',
      'Scroll Sepolia',
      'Alfajores',
      'Base Sepolia',
      'Mantle Testnet',
      'OKX X1'
    ],
    immutable: true,
  },
  transactionUrl: {
    type: String, // Define as a string
    required: false, // Make it optional
  },
});

const Post = models.Post || model('Post', PostSchema);

export default Post;
