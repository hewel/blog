import { sqliteTable, integer, text, primaryKey } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified"),
  image: text("image"),
  phone: text("phone"),
  role: text("role"),
})

export const account = sqliteTable(
  "account",
  {
    userId: text("userId")
      .references(() => user.id)
      .notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    pk: primaryKey(table.provider, table.providerAccountId),
  }),
)

export const session = sqliteTable("session", {
  sessionToken: text("sessionToken").notNull(),
  userId: text("userId")
    .references(() => user.id)
    .notNull(),
  expires: integer("expires").notNull(),
})

export const verificationToken = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires").notNull(),
  },
  (table) => ({
    pk: primaryKey(table.identifier, table.token),
  }),
)

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))
