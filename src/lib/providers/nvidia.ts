export async function callNVIDIA(apiKey: string, messages: any[], model: string): Promise<string> {
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 }),
  })
  const data = await res.json()
  if (data.error) throw new Error(`NVIDIA: ${data.error.message}`)
  return data.choices[0].message.content
}
