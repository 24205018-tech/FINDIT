const { pool, isMockMode } = require('../config/db');
const mockStore = require('../config/mockStore');
const itemModel = require('../models/itemModel');
const userModel = require('../models/userModel');
const claimModel = require('../models/claimModel');

// ---- Mock-mode helpers (used when MySQL is not available) ----
function mockMonthly() {
  const map = {};
  mockStore.items.forEach((i) => {
    const m = String(i.created_at || new Date().toISOString()).slice(0, 7);
    map[m] = map[m] || { month: m, lost: 0, found: 0 };
    map[m][i.kind === 'found' ? 'found' : 'lost'] += 1;
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
}
function mockZones() {
  const map = {};
  mockStore.items.forEach((i) => {
    map[i.location] = map[i.location] || { zone: i.location, count: 0, lost: 0, found: 0 };
    map[i.location].count += 1;
    map[i.location][i.kind === 'found' ? 'found' : 'lost'] += 1;
  });
  const rows = Object.values(map).sort((a, b) => b.count - a.count);
  const max = rows[0]?.count || 1;
  return rows.map((r) => ({ ...r, intensity: Math.min(100, Math.round((r.count / max) * 100)) }));
}

async function getAnalytics(req, res) {
  try {
    const stats = await itemModel.getStats();
    const totalUsers = await userModel.countUsers();
    if (isMockMode()) {
      const pending = mockStore.claims.filter((c) => ['Pending', 'Under Review'].includes(c.status)).length;
      return res.json({
        success: true,
        data: {
          categories: stats.categories,
          locations: stats.locations,
          monthly: mockMonthly(),
          stats: {
            totalUsers,
            lostItems: stats.lost,
            foundItems: stats.found,
            pendingClaims: pending,
            recoveredItems: stats.recovered,
            itemsReported: stats.total,
            matchAccuracy: 91,
          },
        },
      });
    }
    const [pendingClaimsRows] = await pool.query("SELECT COUNT(*) as c FROM claims WHERE status IN ('Pending','Under Review')");
    const [recoveredRows] = await pool.query("SELECT COUNT(*) as c FROM items WHERE status='Recovered'");
    const [monthly] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
             SUM(CASE WHEN kind='lost' THEN 1 ELSE 0 END) as lost,
             SUM(CASE WHEN kind='found' THEN 1 ELSE 0 END) as found
      FROM items GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month ASC LIMIT 12
    `);

    res.json({
      success: true,
      data: {
        categories: stats.categories,
        locations: stats.locations,
        monthly: monthly.map(m => ({ month: m.month, lost: Number(m.lost), found: Number(m.found) })),
        stats: {
          totalUsers,
          lostItems: stats.lost,
          foundItems: stats.found,
          pendingClaims: pendingClaimsRows[0].c,
          recoveredItems: recoveredRows[0].c,
          itemsReported: stats.total,
          matchAccuracy: 91,
        }
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
}

async function getHeatmap(req, res) {
  try {
    if (isMockMode()) {
      await mockStore.initMock();
      return res.json({ success: true, data: mockZones() });
    }
    const [rows] = await pool.query(`
      SELECT location as zone, COUNT(*) as count,
             SUM(CASE WHEN kind='lost' THEN 1 ELSE 0 END) as lost,
             SUM(CASE WHEN kind='found' THEN 1 ELSE 0 END) as found
      FROM items GROUP BY location ORDER BY count DESC
    `);

    // Map to known campus zones for frontend heatmap
    const zones = rows.map(r => ({
      zone: r.zone,
      count: r.count,
      lost: Number(r.lost),
      found: Number(r.found),
      intensity: Math.min(100, Math.round((r.count / (rows[0]?.count || 1)) * 100))
    }));

    res.json({ success: true, data: zones });
  } catch (err) {
    console.error('Heatmap error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch heatmap' });
  }
}

async function getOverview(req, res) {
  try {
    if (isMockMode()) {
      await mockStore.initMock();
      const its = mockStore.items;
      return res.json({
        success: true,
        data: {
          users: mockStore.users.length,
          items: its.length,
          lost: its.filter((i) => i.kind === 'lost').length,
          found: its.filter((i) => i.kind === 'found').length,
          pendingClaims: mockStore.claims.filter((c) => c.status === 'Pending').length,
          recovered: its.filter((i) => i.status === 'Recovered').length,
        },
      });
    }
    const [users] = await pool.query('SELECT COUNT(*) as total FROM users');
    const [items] = await pool.query('SELECT COUNT(*) as total FROM items');
    const [lost] = await pool.query("SELECT COUNT(*) as total FROM items WHERE kind='lost'");
    const [found] = await pool.query("SELECT COUNT(*) as total FROM items WHERE kind='found'");
    const [claims] = await pool.query("SELECT COUNT(*) as total FROM claims WHERE status='Pending'");
    const [recovered] = await pool.query("SELECT COUNT(*) as total FROM items WHERE status='Recovered'");

    res.json({
      success: true,
      data: {
        users: users[0].total,
        items: items[0].total,
        lost: lost[0].total,
        found: found[0].total,
        pendingClaims: claims[0].total,
        recovered: recovered[0].total,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch overview' });
  }
}

module.exports = { getAnalytics, getHeatmap, getOverview };
