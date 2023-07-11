import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "./schema"

export const createDb = (url: string, authToken: string) =>
  drizzle(createClient({ url, authToken }), { schema })

export { schema }
