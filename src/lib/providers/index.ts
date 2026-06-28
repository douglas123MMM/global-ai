import { callOpenAI } from './openai'
import { callAnthropic } from './anthropic'
import { callGoogle } from './google'
import { callMistral } from './mistral'
import { callGroq } from './groq'
import { callNVIDIA } from './nvidia'

export type ProviderResult = { content: string; tokens: number }

export async function callProvider(
  provider: string,
  apiKey: string,
  messages: any[],
  model: string
): Promise<ProviderResult> {
  switch (provider) {
    case 'openai': return callOpenAI(apiKey, messages, model)
    case 'anthropic': return callAnthropic(apiKey, messages, model)
    case 'google': return callGoogle(apiKey, messages, model)
    case 'mistral': return callMistral(apiKey, messages, model)
    case 'groq': return callGroq(apiKey, messages, model)
    case 'nvidia': return callNVIDIA(apiKey, messages, model)
    default: throw new Error(`Proveedor no soportado: ${provider}`)
  }
}

export { callOpenAI, callAnthropic, callGoogle, callMistral, callGroq, callNVIDIA }
