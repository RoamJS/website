"use client";
import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import type { InboxItem } from "@/lib/suggestion-inbox";
export type ReviewDraft = {
  item: InboxItem;
  status: InboxItem["status"];
  note: string;
  recordFollowUp: boolean;
};
type DraftStore = {
  getDraft: (id: string) => ReviewDraft | undefined;
  saveDraft: (id: string, draft: ReviewDraft) => void;
  clearDraft: (id: string) => void;
};
const DraftContext = createContext<DraftStore | null>(null);
const DraftSessionProvider = ({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}): React.JSX.Element => {
  const drafts = useRef(new Map<string, ReviewDraft>());
  const getDraft = useCallback(
    (id: string): ReviewDraft | undefined => {
      return enabled ? drafts.current.get(id) : undefined;
    },
    [enabled],
  );
  const saveDraft = useCallback(
    (id: string, draft: ReviewDraft): void => {
      if (enabled) drafts.current.set(id, draft);
    },
    [enabled],
  );
  const clearDraft = useCallback((id: string): void => {
    drafts.current.delete(id);
  }, []);
  const value = useMemo(
    () => ({ getDraft, saveDraft, clearDraft }),
    [getDraft, saveDraft, clearDraft],
  );
  return (
    <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
  );
};
export const InboxDraftProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  const { user } = useAuth();
  return (
    <DraftSessionProvider
      key={user?.id ?? "signed-out"}
      enabled={Boolean(user)}
    >
      {children}
    </DraftSessionProvider>
  );
};
export const useInboxDrafts = (): DraftStore => {
  const store = useContext(DraftContext);
  if (!store) throw new Error("Inbox draft provider is required");
  return store;
};
