import type { Adapter, AdapterAccount } from "@auth/core/adapters"
import { eq, and } from "drizzle-orm"
import { task as T, taskOption as TO, option as O } from "fp-ts"
import { pipe } from "fp-ts/function"
import { nanoid } from "nanoid"
import { getUnixTime, fromUnixTime } from "date-fns"
import { createDb, schema as s } from "./"

const parseDateAt =
  <K extends string>(key: K) =>
  <T extends Partial<Record<K, Date | null>>>(dict: T): T & Record<K, number | undefined> => ({
    ...dict,
    [key]: pipe(dict[key], O.fromNullable, O.map(getUnixTime), O.toUndefined),
  })

const toDateAt =
  <K extends string>(key: K) =>
  <T extends Record<K, number | null>>(dict: T): T & Record<K, Date | undefined> => ({
    ...dict,
    [key]: pipe(dict[key], O.fromNullable, O.map(fromUnixTime), O.toUndefined),
  })

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
        parseDateAt("emailVerified"),
        (data) => () => db.insert(s.user).values(data).returning().get(),
        T.map(toDateAt("emailVerified")),
      )(),
    getUser: (id) =>
      pipe(
        tryCatchNullable(() =>
          db.query.user.findFirst({
            where: eq(s.user.id, id),
          }),
        ),
        TO.matchW(() => null, toDateAt("emailVerified")),
      )(),
    getUserByEmail: (email) =>
      pipe(
        tryCatchNullable(() =>
          db.query.user.findFirst({
            where: eq(s.user.email, email),
          }),
        ),
        TO.matchW(() => null, toDateAt("emailVerified")),
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
        TO.matchW(() => null, toDateAt("emailVerified")),
      )(),
    updateUser: ({ id, ...data }) =>
      pipe(
        data,
        parseDateAt("emailVerified"),
        (data) => () => db.update(s.user).set(data).where(eq(s.user.id, id!)).returning().get(),
        T.map(toDateAt("emailVerified")),
      )(),
    deleteUser: (userId) =>
      pipe(
        tryCatchNullable(() => db.delete(s.user).where(eq(s.user.id, userId)).returning().get()),
        TO.matchW(() => null, toDateAt("emailVerified")),
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
      db
        .insert(s.session)
        .values({ sessionToken, userId, expires: getUnixTime(expires) })
        .returning()
        .get()
        .then(toDateAt("expires")),
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
            session: toDateAt("expires")(session),
            user: toDateAt("emailVerified")(user),
          }),
        ),
      )(),
    updateSession: ({ sessionToken, ...data }) =>
      db
        .update(s.session)
        .set(parseDateAt("expires")(data))
        .where(eq(s.session.sessionToken, sessionToken))
        .returning()
        .get()
        .then(toDateAt("expires")),
    deleteSession: (sessionToken) =>
      pipe(
        tryCatchNullable(() =>
          db.delete(s.session).where(eq(s.session.sessionToken, sessionToken)).returning().get(),
        ),
        TO.matchW(() => null, toDateAt("expires")),
      )(),
    createVerificationToken: ({ identifier, expires, token }) =>
      db
        .insert(s.verificationToken)
        .values({ identifier, token, expires: getUnixTime(expires) })
        .returning()
        .get()
        .then(toDateAt("expires")),
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
        return pipe(O.fromNullable(verificationToken), O.map(toDateAt("expires")), O.toNullable)
      } catch {
        return null
      }
    },
  }
}
