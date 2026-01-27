// Re-export the real implementation from api.jsx so imports that resolve to
// `api.js` (e.g. due to bundler/extension resolution) still get the named
// exports such as `useGetCurrentAdminQuery` and `api`.
export * from './api.jsx';
// Also re-export the default/common exports if needed (none currently default),
// but keep this file minimal.
