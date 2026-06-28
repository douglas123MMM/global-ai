export async function callGoogle(apiKey: string, messages: any[], model: string): Promise<{ content: string; tokens: number }> {
  const contents = messages.map((m: any) => ({
    parts: [{ text: m.content }],
    role: m.role === 'assistant' ? 'model' : 'user',
  }))
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } }),
  })
  const data = await res.json()
  if (data.error) throw new Error(`Google: ${data.error.message}`)
  return { content: data.candidates[0].content.parts[0].text, tokens: data.usageMetadata?.totalTokenCount || 0 }
}
