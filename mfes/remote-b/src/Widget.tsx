import { useState } from 'react'
import './Widget.css'

// This is the component EXPOSED to the host over Module Federation
// (see vite.config.ts -> exposes['./Widget']). It uses its own React hooks to
// prove the shared `react` singleton is wired correctly across the boundary.
export default function Widget({ greeting = 'Hello' }: { greeting?: string }) {
  const [count, setCount] = useState(0)

  return (
    <div className="remote-widget remote-widget-b">
      <h2>Remote B MFE Widget</h2>
      <p>
        {greeting} 👋 — this card is rendered by the <strong>remoteB</strong> micro-frontend.
      </p>
      <button onClick={() => setCount((c) => c + 1)}>Remote B count: {count}</button>
      <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#888' }}>
        remote-b widget version: {import.meta.env.VITE_APP_VERSION ?? 'dev'}
      </p>
    </div>
  )
}
