import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyReports from '../../pages/MyReports.jsx';
import Dashboard from '../../pages/Dashboard.jsx';
import { buildMatchCatalogue } from '../../utils/matchEngine.js';

vi.mock('../../hooks/useAuth.js', () => ({
  default: () => ({
    user: { id: 'user-claimant', name: 'Dhamini', role: 'student' },
    isAuthenticated: true,
  }),
}));

vi.mock('../../hooks/useToast.jsx', () => ({
  useToast: () => ({ show: vi.fn() }),
}));

vi.mock('../../hooks/useClaims.js', () => ({
  default: () => ({
    claims: [
      {
        id: 'claim-101',
        itemId: 'found-wallet-1',
        status: 'Approved',
      },
    ],
    loading: false,
  }),
}));

describe('Item Recovery Workflow Frontend Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Recovered status badge for recovered lost item in MyReports', async () => {
    vi.mock('../../hooks/useItems.js', () => ({
      default: () => ({
        lostItems: [
          {
            id: 'lost-wallet-1',
            title: 'Lost Brown Leather Wallet',
            category: 'Wallet',
            kind: 'lost',
            status: 'Recovered',
            location: 'Main Library',
            date: '2026-10-08',
            userId: 'user-claimant',
            createdAt: '2026-10-08T10:00:00Z',
          },
        ],
        foundItems: [],
        loading: false,
        deleteItem: vi.fn(),
      }),
    }));

    vi.mock('../../hooks/useMatches.js', () => ({
      default: () => ({
        matches: [],
        loading: false,
      }),
    }));

    render(
      <MemoryRouter initialEntries={['/my-reports']}>
        <MyReports />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Lost Brown Leather Wallet')).toBeInTheDocument();
      expect(screen.getByText('Recovered')).toBeInTheDocument();
    });
  });

  it('excludes recovered and claimed items from buildMatchCatalogue so duplicate claims cannot be submitted', () => {
    const lostPool = [
      {
        id: 'l-1',
        userId: 'user-1',
        title: 'Active Blue Backpack',
        category: 'Bag',
        status: 'Active',
        colour: 'Blue',
        location: 'Library',
      },
      {
        id: 'l-2',
        userId: 'user-1',
        title: 'Recovered Wallet',
        category: 'Wallet',
        status: 'Recovered',
        colour: 'Brown',
        location: 'Cafeteria',
      },
    ];

    const foundPool = [
      {
        id: 'f-1',
        userId: 'user-2',
        title: 'Found Blue Backpack',
        category: 'Bag',
        status: 'Reported',
        colour: 'Blue',
        location: 'Library',
      },
      {
        id: 'f-2',
        userId: 'user-3',
        title: 'Found Brown Wallet',
        category: 'Wallet',
        status: 'Recovered',
        colour: 'Brown',
        location: 'Cafeteria',
      },
    ];

    const matches = buildMatchCatalogue(lostPool, foundPool, 'user-1');
    // Only the active backpack should match, recovered wallet should NOT match
    expect(matches.length).toBe(1);
    expect(matches[0].lostItemId).toBe('l-1');
    expect(matches[0].foundItemId).toBe('f-1');
    expect(matches.some((m) => m.lostItemId === 'l-2' || m.foundItemId === 'f-2')).toBe(false);
  });
});
