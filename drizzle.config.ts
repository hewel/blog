import dotenv from "dotenv"
import type { Config } from "drizzle-kit"

dotenv.configDotenv({
  path: ".env.local",
})

export default {
  schema: "./src/orm/schema.ts",
  out: "./drizzle",
  driver: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config
