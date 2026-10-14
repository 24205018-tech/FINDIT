import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildClaimNotificationMessage,
  createClaimStatusNotification,
} from '../src/utils/claimNotifications.js';

describe('Claim Notification Workflow Unit Tests', () => {
  it('generates the exact approved claim notification message', () => {
    const msgWallet = buildClaimNotificationMessage('Approved', 'wallet');
    assert.equal(
      msgWallet,
      'Your claim for wallet has been approved. You can collect your item.'
    );

    const msgBackpack = buildClaimNotificationMessage('Approved', 'Blue Backpack');
    assert.equal(
      msgBackpack,
      'Your claim for Blue Backpack has been approved. You can collect your item.'
    );
  });

  it('generates the rejected claim notification message explaining rejection', () => {
    const msg = buildClaimNotificationMessage('Rejected', 'wallet');
    assert.equal(msg, 'Your claim for wallet has been rejected.');

    const msgWithReason = buildClaimNotificationMessage(
      'Rejected',
      'wallet',
      'Hidden serial number does not match'
    );
    assert.equal(
      msgWithReason,
      'Your claim for wallet has been rejected: Hidden serial number does not match'
    );
  });

  it('returns null for non-decision statuses like Pending or Cancelled', () => {
    assert.equal(buildClaimNotificationMessage('Pending', 'wallet'), null);
    assert.equal(buildClaimNotificationMessage('Under Review', 'wallet'), null);
    assert.equal(buildClaimNotificationMessage('Cancelled', 'wallet'), null);
  });

  it('creates an unread claim notification with type "claim" and preserves claimant target', async () => {
    const createdDocs = [];
    const mockNotificationModel = {
      create: async (data) => {
        const doc = { _id: `notif-${Date.now()}`, ...data };
        createdDocs.push(doc);
        return doc;
      },
    };

    const notif = await createClaimStatusNotification(mockNotificationModel, {
      user: 'user123',
      itemTitle: 'wallet',
      status: 'Approved',
    });

    assert.ok(notif);
    assert.equal(notif.user, 'user123');
    assert.equal(notif.type, 'claim');
    assert.equal(
      notif.message,
      'Your claim for wallet has been approved. You can collect your item.'
    );
    assert.equal(notif.is_read, false);
    assert.equal(createdDocs.length, 1);
  });

  it('preserves notification history, leaves old notifications unread, and updates notification count correctly on approval', async () => {
    // Initial state: user submitted a claim and has 1 under-review notification
    const notificationStore = [
      {
        _id: 'n-1',
        user: 'user123',
        type: 'claim',
        message: 'Your claim for wallet is now under review.',
        is_read: false,
        createdAt: new Date('2026-10-08T10:00:00Z'),
      },
    ];

    const initialUnreadCount = notificationStore.filter((n) => !n.is_read).length;
    assert.equal(initialUnreadCount, 1);
    assert.equal(notificationStore.length, 1);

    const mockNotificationModel = {
      create: async (data) => {
        const doc = { _id: `n-${notificationStore.length + 1}`, ...data };
        notificationStore.push(doc);
        return doc;
      },
    };

    // Admin approves the claim
    await createClaimStatusNotification(mockNotificationModel, {
      user: 'user123',
      itemTitle: 'wallet',
      status: 'Approved',
    });

    // Requirement 1: Keep existing notification history (now 2 items)
    assert.equal(notificationStore.length, 2);
    assert.equal(notificationStore[0].message, 'Your claim for wallet is now under review.');
    assert.equal(
      notificationStore[1].message,
      'Your claim for wallet has been approved. You can collect your item.'
    );

    // Requirement 5: Do not mark old notifications as read automatically
    assert.equal(notificationStore[0].is_read, false);

    // Requirement 4: Update the notification count correctly (unread count is now 2)
    const updatedUnreadCount = notificationStore.filter((n) => !n.is_read).length;
    assert.equal(updatedUnreadCount, 2);
  });

  it('preserves notification history, leaves old notifications unread, and updates notification count correctly on rejection', async () => {
    // Initial state: user submitted a claim and has 1 under-review notification
    const notificationStore = [
      {
        _id: 'n-1',
        user: 'user123',
        type: 'claim',
        message: 'Your claim for watch is now under review.',
        is_read: false,
        createdAt: new Date('2026-10-08T10:00:00Z'),
      },
    ];

    const mockNotificationModel = {
      create: async (data) => {
        const doc = { _id: `n-${notificationStore.length + 1}`, ...data };
        notificationStore.push(doc);
        return doc;
      },
    };

    // Admin rejects the claim
    await createClaimStatusNotification(mockNotificationModel, {
      user: 'user123',
      itemTitle: 'watch',
      status: 'Rejected',
    });

    // Requirement 1: Keep existing notification history
    assert.equal(notificationStore.length, 2);
    assert.equal(notificationStore[0].message, 'Your claim for watch is now under review.');
    assert.equal(notificationStore[1].message, 'Your claim for watch has been rejected.');

    // Requirement 5: Do not mark old notifications as read automatically
    assert.equal(notificationStore[0].is_read, false);

    // Requirement 4: Notification count updated correctly
    const unreadCount = notificationStore.filter((n) => !n.is_read).length;
    assert.equal(unreadCount, 2);
  });

  it('syncClaimNotificationsForUser automatically creates missing approval notifications for existing approved claims', async () => {
    const claimsStore = [
      {
        _id: 'claim-wallet',
        user: 'user-dhamini',
        item: { title: 'wallet' },
        status: 'Approved',
        updatedAt: new Date('2026-10-09T14:49:49.056Z'),
      },
    ];

    const notificationStore = [
      {
        _id: 'n-old',
        user: 'user-dhamini',
        type: 'claim',
        message: 'Your claim for wallet is now under review.',
        is_read: false,
        createdAt: new Date('2026-10-08T16:54:55.317Z'),
      },
    ];

    const mockClaimModel = {
      find: () => ({
        populate: async () => claimsStore,
      }),
    };

    const mockNotificationModel = {
      findOne: async (query) => {
        return notificationStore.find(
          (n) => n.user === query.user && n.message === query.message
        ) || null;
      },
      create: async (data) => {
        const doc = { _id: `n-${Date.now()}`, ...data };
        notificationStore.push(doc);
        return doc;
      },
    };

    const { syncClaimNotificationsForUser } = await import('../src/utils/claimNotifications.js');

    // First sync should detect the missing approval notification and create it
    const createdFirst = await syncClaimNotificationsForUser('user-dhamini', {
      ClaimModel: mockClaimModel,
      NotificationModel: mockNotificationModel,
    });

    assert.equal(createdFirst.length, 1);
    assert.equal(
      createdFirst[0].message,
      'Your claim for wallet has been approved. You can collect your item.'
    );
    assert.equal(notificationStore.length, 2);
    assert.equal(notificationStore[0].message, 'Your claim for wallet is now under review.');
    assert.equal(
      notificationStore[1].message,
      'Your claim for wallet has been approved. You can collect your item.'
    );

    // Second sync should be idempotent and not create duplicate notifications
    const createdSecond = await syncClaimNotificationsForUser('user-dhamini', {
      ClaimModel: mockClaimModel,
      NotificationModel: mockNotificationModel,
    });
    assert.equal(createdSecond.length, 0);
    assert.equal(notificationStore.length, 2);
  });
});
