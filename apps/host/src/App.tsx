import { useState } from 'react'
import './App.css'
import { RemoteWidget } from './moduleFederation/RemoteWidget'

const version = import.meta.env.VITE_APP_VERSION ?? 'dev'

function App() {
  const [name, setName] = useState('unknown')

  return (
    <main className="host">
      <header>
        <h1>Host app</h1>
        <p className="version">host version: {version}</p>
        <p>
          This is the <strong>host</strong> shell. The cards below are separate{' '}
          <strong>remote</strong> micro-frontends loaded at runtime over Module Federation.
        </p>
        <button
          className="counter"
          onClick={() => {
            fetch('/api/')
              .then((res) => res.json())
              .then((data) => setName(data.name))
          }}
        >
          Name from host API is: {name}
        </button>
      </header>

      <section className="remote-slot">
        <RemoteWidget remoteId="remoteA/Widget" greeting="Hello from the host" />
      </section>

      <section className="remote-slot">
        <RemoteWidget remoteId="remoteB/Widget" greeting="Hello from the host" />
      </section>
    </main>
  )
}

export default App
