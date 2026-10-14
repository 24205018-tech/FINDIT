import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClaimFormModal from '../ClaimFormModal.jsx';

vi.mock('../../hooks/useAuth.js', () => ({
  default: () => ({ user: { id: 'user-1', name: 'Test User' } }),
}));

vi.mock('../../hooks/useClaims.js', () => ({
  default: () => ({ submitClaim: vi.fn() }),
}));

vi.mock('../../hooks/useNotifications.js', () => ({
  default: () => ({ addNotification: vi.fn() }),
}));

vi.mock('../../hooks/useToast.jsx', () => ({
  useToast: () => ({ show: vi.fn() }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('ClaimFormModal typing test', () => {
  it('accepts a complete sentence in the "Why do you believe this is yours?" textarea', async () => {
    const user = userEvent.setup();
    const item = { id: 'item-1', title: 'Black Leather Wallet', kind: 'found' };
    const onClose = vi.fn();

    render(<ClaimFormModal open={true} onClose={onClose} item={item} />);

    const textarea = screen.getByLabelText(/Why do you believe this is yours\?/i);
    expect(textarea).toBeInTheDocument();

    const sentence = 'I lost this black leather wallet near the library yesterday afternoon.';
    await user.type(textarea, sentence);

    expect(textarea.value).toBe(sentence);
  });

  it('accepts complete sentences in step 2 textareas as well', async () => {
    const user = userEvent.setup();
    const item = { id: 'item-1', title: 'Black Leather Wallet', kind: 'found' };
    const onClose = vi.fn();

    render(<ClaimFormModal open={true} onClose={onClose} item={item} />);

    // Step 1
    const reasonTextarea = screen.getByLabelText(/Why do you believe this is yours\?/i);
    await user.type(reasonTextarea, 'My driver license and student ID are inside.');
    expect(reasonTextarea.value).toBe('My driver license and student ID are inside.');

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    await user.click(continueBtn);

    // Step 2
    const hiddenDetailTextarea = screen.getByLabelText(/Hidden identifying detail/i);
    const additionalInfoTextarea = screen.getByLabelText(/Additional information/i);

    expect(hiddenDetailTextarea).toBeInTheDocument();
    expect(additionalInfoTextarea).toBeInTheDocument();

    const hiddenSentence = 'There is a silver initials clip inside the front card slot with initials JD.';
    await user.type(hiddenDetailTextarea, hiddenSentence);
    expect(hiddenDetailTextarea.value).toBe(hiddenSentence);

    const additionalSentence = 'It also contains a folded receipt from the campus coffee shop.';
    await user.type(additionalInfoTextarea, additionalSentence);
    expect(additionalInfoTextarea.value).toBe(additionalSentence);
  });
});

