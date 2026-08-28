# Next.js Turbopack can require local port binding during CSS transforms

In this managed environment, Next.js 16 Turbopack panics while evaluating the Tailwind PostCSS transform because its helper process cannot bind a local port. The application compiles with the supported webpack build path, which does not require that internal port.

Keep the production `build` script on `next build --webpack` unless a future verified Turbopack release removes the local binding requirement. A raw `next build` failure containing `creating new process`, `binding to a port`, and `Operation not permitted` is environmental evidence, not a CSS syntax error.
