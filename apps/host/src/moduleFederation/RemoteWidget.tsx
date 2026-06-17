import {
  Component,
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react'
import { loadRemoteComponent } from './moduleFederationRuntime'

type WidgetProps = { greeting?: string }

// Memoize the lazy component per remoteId so each `remote/Widget` is created
// (and loaded over Module Federation) exactly once.
const lazyByRemoteId = new Map<string, LazyExoticComponent<ComponentType<WidgetProps>>>()

const getRemoteWidget = (remoteId: string) => {
  let component = lazyByRemoteId.get(remoteId)
  if (!component) {
    component = lazy(() => loadRemoteComponent<WidgetProps>(remoteId))
    lazyByRemoteId.set(remoteId, component)
  }
  return component
}

class RemoteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="remote-error">
          <strong>Failed to load remote MFE.</strong>
          <pre>{this.state.error.message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export function RemoteWidget({ remoteId, greeting }: { remoteId: string; greeting?: string }) {
  const Widget = getRemoteWidget(remoteId)
  return (
    <RemoteErrorBoundary>
      <Suspense fallback={<div className="remote-loading">Loading remote MFE…</div>}>
        <Widget greeting={greeting} />
      </Suspense>
    </RemoteErrorBoundary>
  )
}
