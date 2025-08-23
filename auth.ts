import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    schema: {
      user: {
        modelName: "User",
        fields: {
          emailVerified: "emailVerified",
        },
      },
      account: {
        modelName: "Account",
        fields: {
          accountId: "accountId",
        },
      },
      session: {
        modelName: "Session",
      },
      verification: {
        modelName: "Verification",
      },
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  user: {
    additionalFields: {
      emailVerified: {
        type: "date",
        required: false,
      },
    },
  },
})
