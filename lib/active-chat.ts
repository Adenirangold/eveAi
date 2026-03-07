let _activeChatId: string | null = null;

export function getActiveChatId(): string | null {
  return _activeChatId;
}

export function setActiveChatId(id: string | null): void {
  _activeChatId = id;
}
