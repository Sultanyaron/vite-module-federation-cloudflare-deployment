import type { ComponentType } from 'react'
import { loadRemote, registerRemotes } from '@module-federation/runtime'
import { mfeUrls } from './mfeUrls'

let initialized = false

// Register every remote at runtime from the resolved URL map. Doing this at
// runtime (rather than statically in vite.config) is what lets the same build
// load remotes from different URLs in dev vs. deployed environments.
export const initializeModuleFederationRuntime = (): void => {
  if (initialized) return
  registerRemotes(
    Object.entries(mfeUrls).map(([name, entry]) => ({ name, type: 'module', entry })),
    { force: true },
  )
  initialized = true
}

export const loadRemoteModule = async <TModule>(remoteId: string): Promise<TModule> => {
  initializeModuleFederationRuntime()
  const remoteModule = await loadRemote<TModule>(remoteId)
  if (!remoteModule) {
    throw new Error(`Remote "${remoteId}" returned no module`)
  }
  return remoteModule
}

export const loadRemoteComponent = async <TProps = Record<string, never>>(
  remoteId: string,
): Promise<{ default: ComponentType<TProps> }> =>
  loadRemoteModule<{ default: ComponentType<TProps> }>(remoteId)
