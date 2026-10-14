import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Notifications from '../../pages/Notifications.jsx';
import NotificationsBell from '../NotificationsBell.jsx';
import * as api from '../../services/api.js';

vi.mock('../../hooks/useAuth.js', () => ({
  default: () => ({
    user: { id: 'user-1', name: 'Alice Student', role: 'student' },
    isAuthenticated: true,
  }),
}));

vi.mock('../../hooks/useToast.jsx', () => ({
  useToast: () => ({ show: vi.fn() }),
}));

describe('Claim Notifications Workflow Frontend Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders both the existing under-review notification and the approved notification with updated count', async () => {
    const mockNotifications = [
      {
        id: 'n-2',
        userId: 'user-1',
        type: 'claim',
        message: 'Your claim for wallet has been approved. You can collect your item.',
        read: false,
        createdAt: '2026-10-09T10:30:00Z',
      },
      {
        id: 'n-1',
        userId: 'user-1',
        type: 'claim',
        message: 'Your claim for wallet is now under review.',
        read: false,
        createdAt: '2026-10-09T09:00:00Z',
      },
    ];

    vi.spyOn(api.notificationsAPI, 'list').mockResolvedValue({
      success: true,
      data: mockNotifications,
    });

    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <Notifications />
      </MemoryRouter>
    );

    // Wait for notifications to load
    await waitFor(() => {
      expect(
        screen.getByText('Your claim for wallet has been approved. You can collect your item.')
      ).toBeInTheDocument();
    });

    // Requirement 1: Keep existing notification history (both notifications present)
    expect(screen.getByText('Your claim for wallet is now under review.')).toBeInTheDocument();

    // Requirement 4: Notification count updated correctly (2 unread notifications)
    expect(screen.getByText('You have 2 unread notifications.')).toBeInTheDocument();

    // Verify claim filter shows count 2
    expect(screen.getByRole('tab', { name: /claims 2/i })).toBeInTheDocument();
  });

  it('renders both the existing under-review notification and the rejection notification', async () => {
    const mockNotifications = [
      {
        id: 'n-2',
        userId: 'user-1',
        type: 'claim',
        message: 'Your claim for Blue Backpack has been rejected.',
        read: false,
        createdAt: '2026-10-09T11:00:00Z',
      },
      {
        id: 'n-1',
        userId: 'user-1',
        type: 'claim',
        message: 'Your claim for Blue Backpack is now under review.',
        read: false,
        createdAt: '2026-10-09T08:00:00Z',
      },
    ];

    vi.spyOn(api.notificationsAPI, 'list').mockResolvedValue({
      success: true,
      data: mockNotifications,
    });

    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <Notifications />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Your claim for Blue Backpack has been rejected.')).toBeInTheDocument();
    });

    // Both notifications remain in history
    expect(screen.getByText('Your claim for Blue Backpack is now under review.')).toBeInTheDocument();

    // Subtitle shows unread count 2
    expect(screen.getByText('You have 2 unread notifications.')).toBeInTheDocument();
  });

  it('NotificationsBell displays the badge with updated unread count', async () => {
    const mockNotifications = [
      {
        id: 'n-2',
        userId: 'user-1',
        type: 'claim',
        message: 'Your claim for wallet has been approved. You can collect your item.',
        read: false,
        createdAt: '2026-10-09T10:30:00Z',
      },
      {
        id: 'n-1',
        userId: 'user-1',
        type: 'claim',
        message: 'Your claim for wallet is now under review.',
        read: false,
        createdAt: '2026-10-09T09:00:00Z',
      },
    ];

    vi.spyOn(api.notificationsAPI, 'list').mockResolvedValue({
      success: true,
      data: mockNotifications,
    });

    render(
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>
    );

    // Wait for bell bubble to display unread count 2
    await waitFor(() => {
      const bubble = screen.getByText('2');
      expect(bubble).toBeInTheDocument();
      expect(bubble).toHaveClass('notif-bell__bubble');
    });
  });

  it('refreshes notification data dynamically when notifications:refresh event is fired', async () => {
    let currentNotifications = [
      {
        id: 'n-1',
        userId: 'user-1',
        type: 'claim',
        message: 'Your claim for wallet is now under review.',
        read: false,
        createdAt: '2026-10-09T09:00:00Z',
      },
    ];

    const listSpy = vi.spyOn(api.notificationsAPI, 'list').mockImplementation(async () => ({
      success: true,
      data: currentNotifications,
    }));

    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <Notifications />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Your claim for wallet is now under review.')).toBeInTheDocument();
      expect(screen.getByText('You have 1 unread notification.')).toBeInTheDocument();
    });

    // Simulate claim approval by updating API response and dispatching event
    currentNotifications = [
      {
        id: 'n-2',
        userId: 'user-1',
        type: 'claim',
        message: 'Your claim for wallet has been approved. You can collect your item.',
        read: false,
        createdAt: '2026-10-09T10:30:00Z',
      },
      ...currentNotifications,
    ];

    window.dispatchEvent(new CustomEvent('notifications:refresh'));

    // Notifications page automatically updates with new notification and unread count
    await waitFor(() => {
      expect(
        screen.getByText('Your claim for wallet has been approved. You can collect your item.')
      ).toBeInTheDocument();
      expect(screen.getByText('You have 2 unread notifications.')).toBeInTheDocument();
    });

    expect(listSpy).toHaveBeenCalledTimes(2);
  });
});
