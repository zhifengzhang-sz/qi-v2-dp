/**
 * @fileoverview
 * @module init
 *
 * @author zhifengzhang-sz
 * @created 2025-01-31
 * @modified 2025-02-01
 */

db = db.getSiblingDB('chat_db');

// Create collections
db.createCollection('conversations');
db.createCollection('assistants');
db.createCollection('messages');
db.createCollection('settings');

// Create indexes for conversations
db.conversations.createIndex(
  { userId: 1, updatedAt: -1 },
  { partialFilterExpression: { userId: { $exists: true } } }
);
db.conversations.createIndex({ createdAt: 1 });
db.conversations.createIndex({ updatedAt: 1 });

// Create indexes for assistants
db.assistants.createIndex(
  { review: 1, userCount: -1 },
  { name: "review_1_userCount_-1" }
);
db.assistants.createIndex(
  { modelId: 1, userCount: -1 },
  { name: "modelId_1_userCount_-1" }
);

// Create indexes for messages
db.messages.createIndex({ conversationId: 1, createdAt: 1 });
db.messages.createIndex({ updatedAt: 1 });
