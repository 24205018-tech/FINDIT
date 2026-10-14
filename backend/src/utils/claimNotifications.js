import { Notification } from '../models/Notification.js';
import { Claim } from '../models/Claim.js';

/**
 * Claim Status Notification Helpers
 */

export function buildClaimNotificationMessage(status, itemTitle = 'item', reason = '') {
  const title = String(itemTitle || 'item').trim();
  if (status === 'Approved') {
    return `Your claim for ${title} has been approved. You can collect your item.`;
  }
  if (status === 'Rejected') {
    const r = String(reason || '').trim();
    return r
      ? `Your claim for ${title} has been rejected: ${r}`
      : `Your claim for ${title} has been rejected.`;
  }
  return null;
}

export async function createClaimStatusNotification(
  NotificationModel = Notification,
  { user, itemTitle = 'item', status, reason = '' }
) {
  const message = buildClaimNotificationMessage(status, itemTitle, reason);
  if (!message || !user) return null;

  return await NotificationModel.create({
    user,
    type: 'claim',
    message,
    is_read: false,
  });
}

/**
 * Ensures that all approved or rejected claims for a given user (or all users if userId is null)
 * have their corresponding status notification created in the database.
 */
export async function syncClaimNotificationsForUser(
  userId = null,
  { ClaimModel = Claim, NotificationModel = Notification } = {}
) {
  try {
    const filter = userId ? { user: userId } : {};
    const claims = await ClaimModel.find({
      ...filter,
      status: { $in: ['Approved', 'Rejected'] },
    }).populate('item');

    const created = [];
    for (const claim of claims) {
      const claimantId = claim.user?._id || claim.user;
      if (!claimantId) continue;

      const itemTitle = (claim.item?.title || 'item').trim();
      const expectedMessage = buildClaimNotificationMessage(claim.status, itemTitle);
      if (!expectedMessage) continue;

      // Check if this notification already exists for the claimant
      const exists = await NotificationModel.findOne({
        user: claimantId,
        type: 'claim',
        message: expectedMessage,
      });

      if (!exists) {
        const notif = await NotificationModel.create({
          user: claimantId,
          type: 'claim',
          message: expectedMessage,
          is_read: false,
        });
        created.push(notif);
      }
    }
    return created;
  } catch (err) {
    console.error('Error syncing claim notifications:', err.message);
    return [];
  }
}
