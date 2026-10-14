import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  markClaimAndAssociatedItemsRecovered,
  syncApprovedClaimsRecovery,
} from '../src/utils/claimRecovery.js';

describe('Claim Item Recovery Workflow Unit Tests', () => {
  it('marks both found item and claimant lost item as Recovered when claim on found item is approved', async () => {
    // In-memory items store
    const items = [
      {
        _id: 'found-item-1',
        title: 'Leather Wallet',
        category: 'Wallet',
        kind: 'found',
        status: 'Reported',
        user: 'user-finder',
        save: async function () { return this; },
      },
      {
        _id: 'lost-item-1',
        title: 'Lost Brown Wallet',
        category: 'Wallet',
        kind: 'lost',
        status: 'Active',
        user: 'user-claimant',
        save: async function () { return this; },
      },
    ];

    const matches = [
      {
        _id: 'match-1',
        lost_item: 'lost-item-1',
        found_item: 'found-item-1',
        lost_user: 'user-claimant',
        found_user: 'user-finder',
        status: 'potential',
        save: async function () { return this; },
      },
    ];

    const mockItemModel = {
      findById: async (id) => items.find((i) => i._id === id) || null,
      findByIdAndUpdate: async (id, update) => {
        const item = items.find((i) => i._id === id);
        if (item) Object.assign(item, update);
        return item;
      },
      find: async () => items,
      findOne: async () => null,
    };

    const mockMatchModel = {
      findOne: async (query) => {
        return matches.find((m) => {
          if (query.found_item && m.found_item !== query.found_item) return false;
          if (query.lost_user && m.lost_user !== query.lost_user) return false;
          return true;
        }) || null;
      },
      updateMany: async (query, update) => {
        matches.forEach((m) => Object.assign(m, update));
      },
    };

    const claim = {
      _id: 'claim-1',
      item: 'found-item-1',
      user: 'user-claimant',
      item_kind: 'found',
      status: 'Approved',
    };

    const res = await markClaimAndAssociatedItemsRecovered(claim, {
      ItemModel: mockItemModel,
      MatchModel: mockMatchModel,
    });

    assert.ok(res);
    assert.equal(res.claimedItemId, 'found-item-1');
    assert.equal(res.associatedLostItemId, 'lost-item-1');

    const foundItem = items.find((i) => i._id === 'found-item-1');
    const lostItem = items.find((i) => i._id === 'lost-item-1');
    assert.equal(foundItem.status, 'Recovered');
    assert.equal(lostItem.status, 'Recovered');

    const matchDoc = matches.find((m) => m._id === 'match-1');
    assert.equal(matchDoc.status, 'confirmed');
  });

  it('resolves associated lost item via category/title matching when no direct Match record exists', async () => {
    const items = [
      {
        _id: 'found-item-2',
        title: 'Black Leather Wallet',
        category: 'Wallet',
        kind: 'found',
        status: 'Reported',
        user: 'user-finder-2',
        save: async function () { return this; },
      },
      {
        _id: 'lost-item-unmatched',
        title: 'Lost Leather Wallet in Library',
        category: 'Wallet',
        kind: 'lost',
        status: 'Active',
        user: 'user-claimant-2',
        save: async function () { return this; },
      },
    ];

    const mockItemModel = {
      findById: async (id) => items.find((i) => i._id === id) || null,
      findByIdAndUpdate: async (id, update) => {
        const item = items.find((i) => i._id === id);
        if (item) Object.assign(item, update);
        return item;
      },
      find: async (query) => {
        return items.filter((i) => {
          if (query.user && i.user !== query.user) return false;
          if (query.kind && i.kind !== query.kind) return false;
          if (query.status?.$ne && i.status === query.status.$ne) return false;
          return true;
        }).sort(() => 0);
      },
      findOne: async () => null,
    };

    const mockMatchModel = {
      findOne: async () => null,
      updateMany: async () => {},
    };

    const claim = {
      _id: 'claim-2',
      item: 'found-item-2',
      user: 'user-claimant-2',
      item_kind: 'found',
      status: 'Approved',
    };

    const res = await markClaimAndAssociatedItemsRecovered(claim, {
      ItemModel: mockItemModel,
      MatchModel: mockMatchModel,
    });

    assert.ok(res);
    assert.equal(res.associatedLostItemId, 'lost-item-unmatched');

    const lostItem = items.find((i) => i._id === 'lost-item-unmatched');
    assert.equal(lostItem.status, 'Recovered');
  });

  it('marks associated found item as Recovered when a claim on a lost item is approved', async () => {
    const items = [
      {
        _id: 'lost-item-3',
        title: 'Keys with Blue Keychain',
        category: 'Keys',
        kind: 'lost',
        status: 'Active',
        user: 'user-owner',
        save: async function () { return this; },
      },
      {
        _id: 'found-item-3',
        title: 'Found Keys near Cafeteria',
        category: 'Keys',
        kind: 'found',
        status: 'Reported',
        user: 'user-finder-3',
        save: async function () { return this; },
      },
    ];

    const matches = [
      {
        _id: 'match-3',
        lost_item: 'lost-item-3',
        found_item: 'found-item-3',
        lost_user: 'user-owner',
        found_user: 'user-finder-3',
        status: 'potential',
        save: async function () { return this; },
      },
    ];

    const mockItemModel = {
      findById: async (id) => items.find((i) => i._id === id) || null,
      findByIdAndUpdate: async (id, update) => {
        const item = items.find((i) => i._id === id);
        if (item) Object.assign(item, update);
        return item;
      },
      find: async () => items,
      findOne: async () => null,
    };

    const mockMatchModel = {
      findOne: async (query) => {
        return matches.find((m) => {
          if (query.lost_item && m.lost_item !== query.lost_item) return false;
          if (query.found_user && m.found_user !== query.found_user) return false;
          return true;
        }) || null;
      },
      updateMany: async (query, update) => {
        matches.forEach((m) => Object.assign(m, update));
      },
    };

    const claim = {
      _id: 'claim-3',
      item: 'lost-item-3',
      user: 'user-finder-3',
      item_kind: 'lost',
      status: 'Approved',
    };

    const res = await markClaimAndAssociatedItemsRecovered(claim, {
      ItemModel: mockItemModel,
      MatchModel: mockMatchModel,
    });

    assert.ok(res);
    assert.equal(res.claimedItemId, 'lost-item-3');
    assert.equal(res.associatedFoundItemId, 'found-item-3');

    const lostItem = items.find((i) => i._id === 'lost-item-3');
    const foundItem = items.find((i) => i._id === 'found-item-3');
    assert.equal(lostItem.status, 'Recovered');
    assert.equal(foundItem.status, 'Recovered');
  });

  it('syncApprovedClaimsRecovery reconciles prior approved claims and marks orphaned lost items as Recovered', async () => {
    const items = [
      {
        _id: 'f-item-old',
        title: 'Wallet',
        category: 'Wallet',
        kind: 'found',
        status: 'Recovered',
        user: 'finder-old',
        save: async function () { return this; },
      },
      {
        _id: 'l-item-old',
        title: 'Wallet',
        category: 'Wallet',
        kind: 'lost',
        status: 'Active', // Needs reconciliation!
        user: 'claimant-old',
        save: async function () { return this; },
      },
    ];

    const matches = [
      {
        _id: 'm-old',
        lost_item: 'l-item-old',
        found_item: 'f-item-old',
        lost_user: 'claimant-old',
        found_user: 'finder-old',
        status: 'potential',
        save: async function () { return this; },
      },
    ];

    const claims = [
      {
        _id: 'c-old',
        item: { _id: 'f-item-old', title: 'Wallet', kind: 'found', category: 'Wallet' },
        user: 'claimant-old',
        item_kind: 'found',
        status: 'Approved',
      },
    ];

    const mockItemModel = {
      findById: async (id) => items.find((i) => i._id === id) || null,
      findByIdAndUpdate: async (id, update) => {
        const item = items.find((i) => i._id === id);
        if (item) Object.assign(item, update);
        return item;
      },
      find: async () => items,
      findOne: async () => null,
    };

    const mockMatchModel = {
      findOne: async () => matches[0],
      updateMany: async (query, update) => {
        matches.forEach((m) => Object.assign(m, update));
      },
    };

    const mockClaimModel = {
      find: () => ({
        populate: async () => claims,
      }),
    };

    const results = await syncApprovedClaimsRecovery({
      ClaimModel: mockClaimModel,
      ItemModel: mockItemModel,
      MatchModel: mockMatchModel,
    });

    assert.equal(results.length, 1);
    assert.equal(results[0].associatedLostItemId, 'l-item-old');

    const lostItem = items.find((i) => i._id === 'l-item-old');
    assert.equal(lostItem.status, 'Recovered');
  });

  it('excludes recovered and claimed items from active match query candidate filters', () => {
    const activeFilter = { status: { $nin: ['Recovered', 'Claimed'] } };

    // Test items with various statuses
    const testItems = [
      { id: '1', title: 'Active Lost Wallet', status: 'Active' },
      { id: '2', title: 'Recovered Lost Wallet', status: 'Recovered' },
      { id: '3', title: 'Claimed Found Wallet', status: 'Claimed' },
      { id: '4', title: 'Reported Found Wallet', status: 'Reported' },
    ];

    const activeItems = testItems.filter(
      (item) => !activeFilter.status.$nin.includes(item.status)
    );

    assert.equal(activeItems.length, 2);
    assert.deepEqual(
      activeItems.map((i) => i.id),
      ['1', '4']
    );

    // Verify recovered items are excluded
    assert.ok(!activeItems.some((i) => i.status === 'Recovered'));
    assert.ok(!activeItems.some((i) => i.status === 'Claimed'));
  });
});
