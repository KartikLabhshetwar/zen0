import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// Database types
export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  provider: string
  provider_id: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  provider: string
  model: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  metadata: Record<string, any>
  created_at: string
}

// Database operations
export async function createUser(userData: {
  email: string
  name?: string
  image?: string
  provider: string
  provider_id: string
}) {
  const result = await sql`
    INSERT INTO users (email, name, image, provider, provider_id)
    VALUES (${userData.email}, ${userData.name || null}, ${userData.image || null}, ${userData.provider}, ${userData.provider_id})
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      image = EXCLUDED.image,
      updated_at = NOW()
    RETURNING *
  `
  return result[0] as User
}

export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `
  return result[0] as User | undefined
}

export async function createConversation(data: {
  user_id: string
  title?: string
  provider: string
  model: string
}) {
  const result = await sql`
    INSERT INTO conversations (user_id, title, provider, model)
    VALUES (${data.user_id}, ${data.title || "New Chat"}, ${data.provider}, ${data.model})
    RETURNING *
  `
  return result[0] as Conversation
}

export async function getConversationsByUserId(userId: string) {
  const result = await sql`
    SELECT * FROM conversations 
    WHERE user_id = ${userId} 
    ORDER BY updated_at DESC
  `
  return result as Conversation[]
}

export async function getConversationById(id: string, userId: string) {
  const result = await sql`
    SELECT * FROM conversations 
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `
  return result[0] as Conversation | undefined
}

export async function addMessage(data: {
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  metadata?: Record<string, any>
}) {
  const result = await sql`
    INSERT INTO messages (conversation_id, role, content, metadata)
    VALUES (${data.conversation_id}, ${data.role}, ${data.content}, ${JSON.stringify(data.metadata || {})})
    RETURNING *
  `

  // Update conversation's updated_at
  await sql`
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = ${data.conversation_id}
  `

  return result[0] as Message
}

export async function getMessagesByConversationId(conversationId: string) {
  const result = await sql`
    SELECT * FROM messages 
    WHERE conversation_id = ${conversationId} 
    ORDER BY created_at ASC
  `
  return result as Message[]
}

export async function updateConversationTitle(id: string, title: string, userId: string) {
  const result = await sql`
    UPDATE conversations 
    SET title = ${title}, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  return result[0] as Conversation | undefined
}

export async function deleteConversation(id: string, userId: string) {
  await sql`
    DELETE FROM conversations 
    WHERE id = ${id} AND user_id = ${userId}
  `
}
