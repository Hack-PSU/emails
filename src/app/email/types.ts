// src/app/email/types.ts
export type Entry = {
  mailbox: string;
  forwardTo: string;
};

// React-Table’s row-selection state
export type RowSelectionState = Record<string, boolean>;
