import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Load provider credentials from integrations table
export async function getIntegrationCredentials(supabase: any, userId: string, provider: string): Promise<{ api_key?: string; api_secret?: string } | null> {
  const { data, error } = await supabase
    .from("integrations")
    .select("api_key, api_secret, enabled")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("enabled", true)
    .single()

  if (error || !data) return null
  return { api_key: data.api_key as string | undefined, api_secret: data.api_secret as string | undefined }
}
