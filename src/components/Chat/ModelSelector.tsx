'use client'

const MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '🧠' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', icon: '⚡' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: '🎯' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', icon: '🌟' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', icon: '🌪️' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Groq', icon: '🦙' },
  { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'Groq', icon: '🔀' },
  { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', provider: 'nvidia', icon: '🏎️' },
]

const PROVIDER_GROUPS = [
  { name: 'OpenAI', icon: '🧠', models: MODELS.filter((m) => m.provider === 'openai') },
  { name: 'Anthropic', icon: '🎯', models: MODELS.filter((m) => m.provider === 'anthropic') },
  { name: 'Google', icon: '🌟', models: MODELS.filter((m) => m.provider === 'google') },
  { name: 'Mistral', icon: '🌪️', models: MODELS.filter((m) => m.provider === 'mistral') },
  { name: 'Groq', icon: '🦙', models: MODELS.filter((m) => m.provider === 'groq') },
  { name: 'NVIDIA', icon: '🏎️', models: MODELS.filter((m) => m.provider === 'nvidia') },
]

type Props = { value: string; onChange: (v: string) => void }

export default function ModelSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm rounded-xl px-3 py-2 border focus:outline-none focus:border-primary transition cursor-pointer"
      style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
    >
      {PROVIDER_GROUPS.map((group) => (
        <optgroup key={group.name} label={`${group.icon} ${group.name}`}>
          {group.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.icon} {m.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

export { MODELS, PROVIDER_GROUPS }
