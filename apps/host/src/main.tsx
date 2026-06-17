// Async import boundary. Module Federation needs shared singletons (react,
// react-dom) to be initialized before any remote module is evaluated, so the
// real app entry lives in bootstrap.tsx and is loaded dynamically.
import('./bootstrap')
