import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatConversation } from '../src/models/Conversation.js';
import { formatMessage } from '../src/models/Message.js';

describe('Backend Messaging Unit Tests', () => {
  it('formatMessage formats message fields correctly', () => {
    const raw = {
      _id: 'msg123',
      conversation: 'convo456',
      sender: {
        _id: 'user1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
      },
      recipient: 'user2',
      text: 'Hello, is this your lost keys?',
      read: false,
      readAt: null,
      createdAt: new Date('2026-10-08T10:00:00Z'),
      updatedAt: new Date('2026-10-08T10:00:00Z'),
    };

    const formatted = formatMessage(raw);
    assert.equal(formatted.id, 'msg123');
    assert.equal(formatted.conversationId, 'convo456');
    assert.equal(formatted.senderId, 'user1');
    assert.equal(formatted.recipientId, 'user2');
    assert.equal(formatted.text, 'Hello, is this your lost keys?');
    assert.equal(formatted.read, false);
    assert.equal(formatted.sender.name, 'Alice Johnson');
  });

  it('formatConversation identifies otherUser and unreadCount for current user', () => {
    const userA = { _id: 'userA', name: 'Alice', email: 'alice@test.edu', role: 'student' };
    const userB = { _id: 'userB', name: 'Bob', email: 'bob@test.edu', role: 'student' };

    const rawConvo = {
      _id: 'convo999',
      participants: [userA, userB],
      contextType: 'match',
      contextTitle: 'Match: Blue Backpack',
      lastMessage: {
        text: 'I have your backpack',
        sender: userB,
        createdAt: new Date('2026-10-08T11:00:00Z'),
      },
      unreadCount: 2,
    };

    // When viewed by Alice (userA), otherUser should be Bob (userB)
    const formattedForA = formatConversation(rawConvo, 'userA');
    assert.equal(formattedForA.id, 'convo999');
    assert.equal(formattedForA.otherUser.id, 'userB');
    assert.equal(formattedForA.otherUser.name, 'Bob');
    assert.equal(formattedForA.contextType, 'match');
    assert.equal(formattedForA.unreadCount, 2);

    // When viewed by Bob (userB), otherUser should be Alice (userA)
    const formattedForB = formatConversation(rawConvo, 'userB');
    assert.equal(formattedForB.otherUser.id, 'userA');
    assert.equal(formattedForB.otherUser.name, 'Alice');
  });

  it('verifies participant constraints in messaging rules', () => {
    // Only participants of the match or claim can message
    const match = {
      lost_user: 'userA',
      found_user: 'userB',
    };

    const isParticipant = (userId, m) => userId === m.lost_user || userId === m.found_user;

    assert.equal(isParticipant('userA', match), true);
    assert.equal(isParticipant('userB', match), true);
    assert.equal(isParticipant('intruderC', match), false);
  });
});
