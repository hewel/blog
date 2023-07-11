import type { Adapter, AdapterAccount } from "@auth/core/adapters"
import { eq, and } from "drizzle-orm"
import { task as T, taskOption as TO, option as O } from "fp-ts"
import { pipe } from "fp-ts/function"
import { nanoid } from "nanoid"
import { createDb, schema as s } from "./"

const tryCatchNullable = T.map(O.fromNullable)

interface AdapterOptions {
  url: string
  authToken: string
  adminEmail?: string
}

export const DrizzleAdapter = ({ url, authToken }: AdapterOptions): Adapter => {
  const db = createDb(url, authToken)
  return {
    createUser: (user) =>
      pipe(
        { ...user, id: nanoid(8) },
        (data) => () => db.insert(s.user).values(data).returning().get(),
      )(),
    getUser: (id) =>
      pipe(
        tryCatchNullable(() =>
          db.query.user.findFirst({
            where: eq(s.user.id, id),
          }),
        ),
        TO.getOrElseW(() => T.of(null)),
      )(),
    getUserByEmail: (email) =>
      pipe(
        tryCatchNullable(() =>
          db.query.user.findFirst({
            where: eq(s.user.email, email),
          }),
        ),
        TO.getOrElseW(() => T.of(null)),
      )(),
    getUserByAccount: ({ providerAccountId, provider }) =>
      pipe(
        tryCatchNullable(() =>
          db.query.account.findFirst({
            where: and(
              eq(s.account.providerAccountId, providerAccountId),
              eq(s.account.provider, provider),
            ),
            with: {
              user: true,
            },
          }),
        ),
        TO.map(({ user }) => user),
        TO.getOrElseW(() => T.of(null)),
      )(),
    updateUser: ({ id, ...data }) =>
      pipe(
        data,
        (data) => () => db.update(s.user).set(data).where(eq(s.user.id, id!)).returning().get(),
      )(),
    deleteUser: (userId) =>
      pipe(
        tryCatchNullable(() => db.delete(s.user).where(eq(s.user.id, userId)).returning().get()),
        TO.getOrElseW(() => T.of(null)),
      )(),
    linkAccount: ({ expires_in, ...data }) =>
      db.insert(s.account).values(data).returning().get() as Promise<AdapterAccount>,
    unlinkAccount: ({ providerAccountId, provider }) =>
      db
        .delete(s.account)
        .where(
          and(eq(s.account.providerAccountId, providerAccountId), eq(s.account.provider, provider)),
        )
        .returning()
        .get() as Promise<AdapterAccount>,
    createSession: ({ sessionToken, userId, expires }) =>
      db.insert(s.session).values({ sessionToken, userId, expires }).returning().get(),
    getSessionAndUser: (sessionToken) =>
      pipe(
        tryCatchNullable(() =>
          db.query.session.findFirst({
            where: eq(s.session.sessionToken, sessionToken),
            with: {
              user: true,
            },
          }),
        ),
        TO.matchW(
          () => null,
          ({ user, ...session }) => ({
            session: session,
            user: user,
          }),
        ),
      )(),
    updateSession: ({ sessionToken, ...data }) =>
      db
        .update(s.session)
        .set(data)
        .where(eq(s.session.sessionToken, sessionToken))
        .returning()
        .get(),
    deleteSession: (sessionToken) =>
      pipe(
        tryCatchNullable(() =>
          db.delete(s.session).where(eq(s.session.sessionToken, sessionToken)).returning().get(),
        ),
        TO.getOrElseW(() => T.of(null)),
      )(),
    createVerificationToken: ({ identifier, expires, token }) =>
      db.insert(s.verificationToken).values({ identifier, token, expires }).returning().get(),
    useVerificationToken: async ({ identifier, token }) => {
      try {
        const verificationToken = await db
          .delete(s.verificationToken)
          .where(
            and(
              eq(s.verificationToken.identifier, identifier),
              eq(s.verificationToken.token, token),
            ),
          )
          .returning()
          .get()
        return pipe(O.fromNullable(verificationToken), O.toNullable)
      } catch {
        return null
      }
    },
  }
}
