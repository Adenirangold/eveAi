import type { ChatMessage } from "@/services/chat";
import type { AvailableContact, Contact } from "@/services/contacts";
import type { Story } from "@/services/stories";
import { type SQLiteDatabase, openDatabaseSync } from "expo-sqlite";

// ── Per-user database singleton ──────────────────────

let _db: SQLiteDatabase | null = null;
let _currentUserId: string | null = null;

export function setDatabaseUser(userId: string | null): void {
  if (userId === _currentUserId) return;
  if (_db) {
    _db.closeSync();
    _db = null;
  }
  _currentUserId = userId;
  if (userId) getDb();
}

function getDb(): SQLiteDatabase | null {
  if (!_currentUserId) return null;

  if (!_db) {
    _db = openDatabaseSync(`eveai-${_currentUserId}.db`);

    _db.execSync(`CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)`);

    const schemaVersion =
      _db.getFirstSync<{ value: string }>(`SELECT value FROM _meta WHERE key = 'schema_version'`)
        ?.value ?? "0";

    const version = parseInt(schemaVersion, 10);

    if (version < 3) {
      _db.execSync(`DROP TABLE IF EXISTS contacts`);
      _db.execSync(`DROP TABLE IF EXISTS available_contacts`);
      _db.execSync(`DROP TABLE IF EXISTS stories`);
    }

    if (version < 4) {
      _db.execSync(`DROP TABLE IF EXISTS unread_counts`);
      _db.execSync(`INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', '4')`);
    }

    _db.execSync(`
      CREATE TABLE IF NOT EXISTS contacts (
        id        TEXT PRIMARY KEY NOT NULL,
        name      TEXT NOT NULL,
        slug      TEXT NOT NULL,
        avatar    TEXT,
        bio       TEXT NOT NULL,
        isPremium INTEGER NOT NULL DEFAULT 0,
        addedAt   TEXT NOT NULL
      )
    `);

    _db.execSync(`
      CREATE TABLE IF NOT EXISTS available_contacts (
        id        TEXT PRIMARY KEY NOT NULL,
        name      TEXT NOT NULL,
        slug      TEXT NOT NULL,
        avatar    TEXT,
        bio       TEXT NOT NULL,
        isPremium INTEGER NOT NULL DEFAULT 0
      )
    `);

    _db.execSync(`
      CREATE TABLE IF NOT EXISTS stories (
        id                TEXT PRIMARY KEY NOT NULL,
        content           TEXT NOT NULL,
        backgroundColor   TEXT NOT NULL,
        createdAt         TEXT NOT NULL,
        expiresAt         TEXT NOT NULL,
        contactId         TEXT NOT NULL,
        contactName       TEXT NOT NULL,
        contactSlug       TEXT NOT NULL,
        contactAvatar     TEXT,
        contactIsPremium  INTEGER NOT NULL DEFAULT 0
      )
    `);

    _db.execSync(`
      CREATE TABLE IF NOT EXISTS viewed_stories (
        storyId  TEXT PRIMARY KEY NOT NULL
      )
    `);

    _db.execSync(`
      CREATE TABLE IF NOT EXISTS messages (
        id        TEXT PRIMARY KEY NOT NULL,
        userId    TEXT NOT NULL,
        contactId TEXT NOT NULL,
        role      TEXT NOT NULL,
        content   TEXT NOT NULL,
        bibleRefs TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    _db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_messages_contact
        ON messages (contactId, createdAt ASC)
    `);

    _db.execSync(`
      CREATE TABLE IF NOT EXISTS unread_counts (
        contactId   TEXT PRIMARY KEY NOT NULL,
        count       INTEGER NOT NULL DEFAULT 0,
        lastContent TEXT,
        lastAt      TEXT
      )
    `);

  }
  return _db;
}

// ── Contacts ─────────────────────────────────────────

export function getLocalContacts(): Contact[] {
  const db = getDb();
  if (!db) return [];
  return db
    .getAllSync<any>("SELECT * FROM contacts ORDER BY addedAt DESC")
    .map((r) => ({ ...r, isPremium: !!r.isPremium }));
}

export function saveLocalContacts(contacts: Contact[]): void {
  const db = getDb();
  if (!db) return;
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM contacts");
    for (const c of contacts) {
      db.runSync(
        "INSERT INTO contacts (id, name, slug, avatar, bio, isPremium, addedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [c.id, c.name, c.slug, c.avatar, c.bio, c.isPremium ? 1 : 0, c.addedAt],
      );
    }
  });
}

export function getLocalContactById(id: string): Contact | null {
  const db = getDb();
  if (!db) return null;
  const r = db.getFirstSync<any>("SELECT * FROM contacts WHERE id = ?", [id]);
  return r ? { ...r, isPremium: !!r.isPremium } : null;
}

export function deleteLocalContact(id: string): void {
  const db = getDb();
  if (!db) return;
  db.runSync("DELETE FROM contacts WHERE id = ?", [id]);
}

// ── Available Contacts ───────────────────────────────

export function getLocalAvailableContacts(): AvailableContact[] {
  const db = getDb();
  if (!db) return [];
  return db
    .getAllSync<any>("SELECT * FROM available_contacts ORDER BY name ASC")
    .map((r) => ({ ...r, isPremium: !!r.isPremium }));
}

export function saveLocalAvailableContacts(contacts: AvailableContact[]): void {
  const db = getDb();
  if (!db) return;
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM available_contacts");
    for (const c of contacts) {
      db.runSync(
        "INSERT INTO available_contacts (id, name, slug, avatar, bio, isPremium) VALUES (?, ?, ?, ?, ?, ?)",
        [c.id, c.name, c.slug, c.avatar, c.bio, c.isPremium ? 1 : 0],
      );
    }
  });
}

// ── Stories ──────────────────────────────────────────

interface StoryRow {
  id: string;
  content: string;
  backgroundColor: string;
  createdAt: string;
  expiresAt: string;
  contactId: string;
  contactName: string;
  contactSlug: string;
  contactAvatar: string;
  contactIsPremium: number;
}

function rowToStory(row: StoryRow): Story {
  return {
    id: row.id,
    content: row.content,
    backgroundColor: JSON.parse(row.backgroundColor),
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    contact: {
      id: row.contactId,
      name: row.contactName,
      slug: row.contactSlug,
      avatar: row.contactAvatar,
      isPremium: !!row.contactIsPremium,
    },
  };
}

export function getLocalStories(): Story[] {
  const db = getDb();
  if (!db) return [];
  return db
    .getAllSync<StoryRow>("SELECT * FROM stories ORDER BY createdAt DESC")
    .map(rowToStory);
}

export function saveLocalStories(stories: Story[]): void {
  const db = getDb();
  if (!db) return;
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM stories");
    for (const s of stories) {
      db.runSync(
        "INSERT INTO stories (id, content, backgroundColor, createdAt, expiresAt, contactId, contactName, contactSlug, contactAvatar, contactIsPremium) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          s.id,
          s.content,
          JSON.stringify(s.backgroundColor),
          s.createdAt,
          s.expiresAt,
          s.contact.id,
          s.contact.name,
          s.contact.slug,
          s.contact.avatar,
          s.contact.isPremium ? 1 : 0,
        ],
      );
    }
  });
}

// ── Viewed Stories ───────────────────────────────────

export function getViewedStoryIds(): Set<string> {
  const db = getDb();
  if (!db) return new Set();
  const rows = db.getAllSync<{ storyId: string }>(
    "SELECT storyId FROM viewed_stories",
  );
  return new Set(rows.map((r) => r.storyId));
}

export function markStoryViewed(storyId: string): void {
  const db = getDb();
  if (!db) return;
  db.runSync(
    "INSERT OR IGNORE INTO viewed_stories (storyId) VALUES (?)",
    [storyId],
  );
}

// ── Messages ────────────────────────────────────────

export function getLocalMessages(contactId: string): ChatMessage[] {
  const db = getDb();
  if (!db) return [];
  return db
    .getAllSync<any>(
      "SELECT * FROM messages WHERE contactId = ? ORDER BY createdAt ASC",
      [contactId],
    )
    .map((r) => ({
      ...r,
      bibleRefs: r.bibleRefs ? JSON.parse(r.bibleRefs) : null,
    }));
}

export function upsertLocalMessages(messages: ChatMessage[]): void {
  if (messages.length === 0) return;
  const db = getDb();
  if (!db) return;
  db.withTransactionSync(() => {
    for (const m of messages) {
      db.runSync(
        `INSERT OR REPLACE INTO messages
          (id, userId, contactId, role, content, bibleRefs, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          m.id,
          m.userId,
          m.contactId,
          m.role,
          m.content,
          m.bibleRefs ? JSON.stringify(m.bibleRefs) : null,
          m.createdAt,
        ],
      );
    }
  });
}

// ── Last message per contact ─────────────────────────

export interface LastMessageInfo {
  content: string;
  createdAt: string;
}

export function getLastMessageByContact(): Map<string, LastMessageInfo> {
  const db = getDb();
  if (!db) return new Map();
  const rows = db.getAllSync<{
    contactId: string;
    content: string;
    createdAt: string;
  }>(
    `SELECT m.contactId, m.content, m.createdAt
     FROM messages m
     INNER JOIN (
       SELECT contactId, MAX(createdAt) AS maxTime
       FROM messages GROUP BY contactId
     ) latest ON m.contactId = latest.contactId AND m.createdAt = latest.maxTime`,
  );
  return new Map(
    rows.map((r) => [r.contactId, { content: r.content, createdAt: r.createdAt }]),
  );
}

// ── Unread counts ───────────────────────────────────

export interface UnreadInfo {
  count: number;
  lastContent: string | null;
  lastAt: string | null;
}

export function getUnreadCounts(): Map<string, UnreadInfo> {
  const db = getDb();
  if (!db) return new Map();
  const rows = db.getAllSync<{
    contactId: string;
    count: number;
    lastContent: string | null;
    lastAt: string | null;
  }>("SELECT * FROM unread_counts WHERE count > 0");
  return new Map(
    rows.map((r) => [
      r.contactId,
      { count: r.count, lastContent: r.lastContent, lastAt: r.lastAt },
    ]),
  );
}

export function incrementUnread(
  contactId: string,
  content: string | null,
  createdAt: string | null,
): void {
  const db = getDb();
  if (!db) return;
  db.runSync(
    `INSERT INTO unread_counts (contactId, count, lastContent, lastAt)
     VALUES (?, 1, ?, ?)
     ON CONFLICT(contactId) DO UPDATE SET
       count = count + 1,
       lastContent = excluded.lastContent,
       lastAt = excluded.lastAt`,
    [contactId, content, createdAt],
  );
}

export function clearUnread(contactId: string): void {
  const db = getDb();
  if (!db) return;
  db.runSync("DELETE FROM unread_counts WHERE contactId = ?", [contactId]);
}

// ── Clear all ───────────────────────────────────────

export function clearDatabase(): void {
  const db = getDb();
  if (!db) return;
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM contacts");
    db.runSync("DELETE FROM available_contacts");
    db.runSync("DELETE FROM stories");
    db.runSync("DELETE FROM viewed_stories");
    db.runSync("DELETE FROM messages");
    db.runSync("DELETE FROM unread_counts");
  });
}
