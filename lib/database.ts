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

    _db.execSync(`
      CREATE TABLE IF NOT EXISTS contacts (
        id       TEXT PRIMARY KEY NOT NULL,
        name     TEXT NOT NULL,
        slug     TEXT NOT NULL,
        avatar   TEXT NOT NULL,
        bio      TEXT NOT NULL,
        addedAt  TEXT NOT NULL
      )
    `);

    _db.execSync(`
      CREATE TABLE IF NOT EXISTS available_contacts (
        id       TEXT PRIMARY KEY NOT NULL,
        name     TEXT NOT NULL,
        slug     TEXT NOT NULL,
        avatar   TEXT NOT NULL,
        bio      TEXT NOT NULL
      )
    `);

    _db.execSync(`
      CREATE TABLE IF NOT EXISTS stories (
        id             TEXT PRIMARY KEY NOT NULL,
        content        TEXT NOT NULL,
        backgroundColor TEXT NOT NULL,
        createdAt      TEXT NOT NULL,
        expiresAt      TEXT NOT NULL,
        contactId      TEXT NOT NULL,
        contactName    TEXT NOT NULL,
        contactSlug    TEXT NOT NULL,
        contactAvatar  TEXT NOT NULL
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
  }
  return _db;
}

// ── Contacts ─────────────────────────────────────────

export function getLocalContacts(): Contact[] {
  const db = getDb();
  if (!db) return [];
  return db.getAllSync<Contact>(
    "SELECT * FROM contacts ORDER BY addedAt DESC",
  );
}

export function saveLocalContacts(contacts: Contact[]): void {
  const db = getDb();
  if (!db) return;
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM contacts");
    for (const c of contacts) {
      db.runSync(
        "INSERT INTO contacts (id, name, slug, avatar, bio, addedAt) VALUES (?, ?, ?, ?, ?, ?)",
        [c.id, c.name, c.slug, c.avatar, c.bio, c.addedAt],
      );
    }
  });
}

export function getLocalContactById(id: string): Contact | null {
  const db = getDb();
  if (!db) return null;
  return (
    db.getFirstSync<Contact>("SELECT * FROM contacts WHERE id = ?", [id]) ??
    null
  );
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
  return db.getAllSync<AvailableContact>(
    "SELECT * FROM available_contacts ORDER BY name ASC",
  );
}

export function saveLocalAvailableContacts(contacts: AvailableContact[]): void {
  const db = getDb();
  if (!db) return;
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM available_contacts");
    for (const c of contacts) {
      db.runSync(
        "INSERT INTO available_contacts (id, name, slug, avatar, bio) VALUES (?, ?, ?, ?, ?)",
        [c.id, c.name, c.slug, c.avatar, c.bio],
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
        "INSERT INTO stories (id, content, backgroundColor, createdAt, expiresAt, contactId, contactName, contactSlug, contactAvatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
        ],
      );
    }
  });
}

// ── Messages ────────────────────────────────────────

export function getLocalMessages(contactId: string): ChatMessage[] {
  const db = getDb();
  if (!db) return [];
  return db.getAllSync<ChatMessage>(
    "SELECT * FROM messages WHERE contactId = ? ORDER BY createdAt ASC",
    [contactId],
  );
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
          m.bibleRefs,
          m.createdAt,
        ],
      );
    }
  });
}

// ── Clear all ───────────────────────────────────────

export function clearDatabase(): void {
  const db = getDb();
  if (!db) return;
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM contacts");
    db.runSync("DELETE FROM available_contacts");
    db.runSync("DELETE FROM stories");
    db.runSync("DELETE FROM messages");
  });
}
