import type { AvailableContact, Contact } from "@/services/contacts";
import type { Story } from "@/services/stories";
import { type SQLiteDatabase, openDatabaseSync } from "expo-sqlite";

// ── Lazy singleton ───────────────────────────────────

let _db: SQLiteDatabase | null = null;

function getDb(): SQLiteDatabase {
  if (!_db) {
    _db = openDatabaseSync("eveai.db");

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
  }
  return _db;
}

export function initDatabase(): void {
  getDb();
}

// ── Contacts ─────────────────────────────────────────

export function getLocalContacts(): Contact[] {
  const db = getDb();
  return db.getAllSync<Contact>(
    "SELECT * FROM contacts ORDER BY addedAt DESC",
  );
}

export function saveLocalContacts(contacts: Contact[]): void {
  const db = getDb();
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

export function deleteLocalContact(id: string): void {
  const db = getDb();
  db.runSync("DELETE FROM contacts WHERE id = ?", [id]);
}

// ── Available Contacts ───────────────────────────────

export function getLocalAvailableContacts(): AvailableContact[] {
  const db = getDb();
  return db.getAllSync<AvailableContact>(
    "SELECT * FROM available_contacts ORDER BY name ASC",
  );
}

export function saveLocalAvailableContacts(contacts: AvailableContact[]): void {
  const db = getDb();
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
  return db
    .getAllSync<StoryRow>("SELECT * FROM stories ORDER BY createdAt DESC")
    .map(rowToStory);
}

export function saveLocalStories(stories: Story[]): void {
  const db = getDb();
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

export function clearDatabase(): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM contacts");
    db.runSync("DELETE FROM available_contacts");
    db.runSync("DELETE FROM stories");
  });
}
