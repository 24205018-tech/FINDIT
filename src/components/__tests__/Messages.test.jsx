import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MatchCard from '../MatchCard.jsx';
import Messages from '../../pages/Messages.jsx';
import * as api from '../../services/api.js';

vi.mock('../../hooks/useAuth.js', () => ({
  default: () => ({
    user: { id: 'user-me', name: 'John Doe', role: 'student' },
    isAuthenticated: true,
  }),
}));

vi.mock('../../hooks/useToast.jsx', () => ({
  useToast: () => ({ show: vi.fn() }),
}));

describe('Smart Match "Message User" CTA', () => {
  it('renders "Message User" button when current user is a participant', async () => {
    const user = userEvent.setup();
    const onMessage = vi.fn();

    const match = {
      id: 'match-1',
      score: 88,
      lostItem: { id: 'lost-1', title: 'Blue Backpack', userId: 'user-me', location: 'Library' },
      foundItem: { id: 'found-1', title: 'Blue Backpack', userId: 'user-other', location: 'Library' },
    };

    render(
      <MemoryRouter>
        <MatchCard match={match} onMessage={onMessage} />
      </MemoryRouter>
    );

    const messageBtn = screen.getByRole('button', { name: /message user/i });
    expect(messageBtn).toBeInTheDocument();

    await user.click(messageBtn);
    expect(onMessage).toHaveBeenCalledWith(match, 'user-other');
  });
});

describe('Messages Page UI & Chat Interactions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders conversation list with participant name and message snippet', async () => {
    const mockConversations = [
      {
        id: 'c-1',
        contextType: 'match',
        contextTitle: 'Match: Blue Backpack',
        unreadCount: 2,
        otherUser: { id: 'user-other', name: 'Alice Smith', role: 'student' },
        participants: [
          { id: 'user-me', name: 'John Doe' },
          { id: 'user-other', name: 'Alice Smith' },
        ],
        lastMessage: {
          text: 'I think I found your backpack in the cafe',
          sender: 'user-other',
          createdAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(api.conversationsAPI, 'list').mockResolvedValue({
      success: true,
      data: mockConversations,
    });

    vi.spyOn(api.conversationsAPI, 'getMessages').mockResolvedValue({
      success: true,
      data: [
        {
          id: 'm-1',
          conversationId: 'c-1',
          senderId: 'user-other',
          recipientId: 'user-me',
          text: 'I think I found your backpack in the cafe',
          sender: { id: 'user-other', name: 'Alice Smith' },
          createdAt: new Date().toISOString(),
          read: true,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/messages']}>
        <Messages />
      </MemoryRouter>
    );

    // Verify conversation list item
    await waitFor(() => {
      expect(screen.getAllByText('Alice Smith').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Match: Blue Backpack').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/I think I found your backpack/i).length).toBeGreaterThan(0);
  });

  it('allows user to type and send a new message in chat', async () => {
    const user = userEvent.setup();

    const mockConversations = [
      {
        id: 'c-1',
        contextType: 'match',
        contextTitle: 'Match: Blue Backpack',
        unreadCount: 0,
        otherUser: { id: 'user-other', name: 'Alice Smith', role: 'student' },
        participants: [
          { id: 'user-me', name: 'John Doe' },
          { id: 'user-other', name: 'Alice Smith' },
        ],
        lastMessage: { text: 'Hello', sender: 'user-other', createdAt: new Date().toISOString() },
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(api.conversationsAPI, 'list').mockResolvedValue({
      success: true,
      data: mockConversations,
    });

    vi.spyOn(api.conversationsAPI, 'getMessages').mockResolvedValue({
      success: true,
      data: [
        {
          id: 'm-1',
          conversationId: 'c-1',
          senderId: 'user-other',
          recipientId: 'user-me',
          text: 'Hello',
          sender: { id: 'user-other', name: 'Alice Smith' },
          createdAt: new Date().toISOString(),
          read: true,
        },
      ],
    });

    const sendSpy = vi.spyOn(api.conversationsAPI, 'sendMessage').mockResolvedValue({
      success: true,
      data: {
        id: 'm-2',
        conversationId: 'c-1',
        senderId: 'user-me',
        recipientId: 'user-other',
        text: 'Thank you! Where can we meet to exchange it?',
        sender: { id: 'user-me', name: 'John Doe' },
        createdAt: new Date().toISOString(),
        read: false,
      },
    });

    render(
      <MemoryRouter initialEntries={['/messages?conversationId=c-1']}>
        <Messages />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/type your message/i);
    expect(textarea).toBeInTheDocument();

    await user.type(textarea, 'Thank you! Where can we meet to exchange it?');
    expect(textarea.value).toBe('Thank you! Where can we meet to exchange it?');

    const sendBtn = screen.getByRole('button', { name: /send message/i });
    await user.click(sendBtn);

    expect(sendSpy).toHaveBeenCalledWith('c-1', {
      text: 'Thank you! Where can we meet to exchange it?',
    });

    // Check textarea was cleared after sending
    expect(textarea.value).toBe('');
  });
});
