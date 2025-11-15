import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import ConversationItem from '@/content/components/ConversationList/ConversationItem';
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
});
