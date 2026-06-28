export async function callAnthropic(apiKey: string, messages: any[], model: string): Promise<string> {
  const system = messages.find((m: any) => m.role === 'system')?.content || ''
  const msgs = messages.filter((m: any) => m.role !== 'system').map((m: any) => ({ role: m.role, content: m.content }))
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, system, messages: msgs, max_tokens: 4096, temperature: 0.7 }),
  })
  const data = await res.json()
  if (data.error) throw new Error(`Anthropic: ${data.error.message}`)
  return data.content[0].text
}
