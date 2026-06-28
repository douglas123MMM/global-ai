export async function callOpenAI(apiKey: string, messages: any[], model: string): Promise<{ content: string; tokens: number }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 }),
  })
  const data = await res.json()
  if (data.error) throw new Error(`OpenAI: ${data.error.message}`)
  return { content: data.choices[0].message.content, tokens: data.usage?.total_tokens || 0 }
}
