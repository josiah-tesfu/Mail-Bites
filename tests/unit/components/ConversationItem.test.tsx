import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { vi } from 'vitest';

import ConversationItem from '@/content/components/ConversationList/ConversationItem';
import { animationTimings } from '@/content/hooks/useAnimations';
import type { ConversationData } from '@/content/ui/conversationParser';
import { resetConversationStore, useConversationStore } from '@/content/store/useConversationStore';

const createConversation = (): ConversationData => ({
  id: 'conv-1',
  sender: 'Tester',
  subject: 'Hello',
  snippet: 'Snippet text',
  date: '10:00 AM',
  isUnread: true,
  mode: 'read'
});

describe('ConversationItem reply composer', () => {
  beforeEach(() => {
    resetConversationStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens inline composer without crashing when reply is clicked', async () => {
    const conversation = createConversation();
    const store = useConversationStore.getState();
    store.setConversations([conversation]);
    store.expandConversation(conversation.id);
    store.setConversationMode(conversation.id, 'read');

    const user = userEvent.setup();
    render(<ConversationItem conversation={conversation} />);

    await user.click(screen.getByTitle('Reply to conversation'));

    expect(useConversationStore.getState().conversationModes.get(conversation.id)).toBe('reply');
    expect(screen.getByLabelText('Message body')).toBeInTheDocument();
  });

  it('waits for collapse animation but ignores hover state when marking as read', () => {
    vi.useFakeTimers();
    const conversation = createConversation();
    const store = useConversationStore.getState();
    store.setConversations([conversation]);

    render(<ConversationItem conversation={conversation} />);

    const card = screen.getByRole('article');

    act(() => {
      fireEvent.mouseEnter(card);
    });

    act(() => {
      fireEvent.click(card);
    });

    act(() => {
      fireEvent.click(card);
    });

    const duringCollapse = useConversationStore
      .getState()
      .conversations.find((entry) => entry.id === conversation.id);

    expect(duringCollapse?.isUnread).toBe(true);

    act(() => {
      vi.advanceTimersByTime(animationTimings.COLLAPSE_TRANSITION_DURATION);
    });

    const updated = useConversationStore
      .getState()
      .conversations.find((entry) => entry.id === conversation.id);

    expect(updated?.isUnread).toBe(false);
  });
});
