export type ConversationRow = HTMLTableRowElement & {
  dataset: DOMStringMap & {
    legacyThreadId?: string;
  };
};
