/**
 * Seeding Script for AI Second Brain
 * Populates 50 developer knowledge entries (StackOverflow, MDN, GitHub, etc.)
 * 
 * Usage:
 *   Local seed (direct database):  node scratch/seed.js
 *   Remote seed (via API):         node scratch/seed.js --remote https://your-app.onrender.com
 */

const fs = require('fs');
const path = require('path');

// 50 realistic developer pages
const mockPages = [
  {
    url: 'https://stackoverflow.com/questions/15647/how-to-fix-cors-error-in-express',
    title: 'How to fix CORS error in Express Node.js',
    source_type: 'stackoverflow',
    domain: 'stackoverflow.com',
    topics: ['express', 'nodejs', 'cors', 'security', 'api'],
    summary: 'Explains how to resolve Cross-Origin Resource Sharing (CORS) errors in Express using the `cors` middleware, manual headers, and wildcard origins for API access.',
    raw_content: 'QUESTION: How do I enable CORS in my Express application? I keep getting CORS errors on the frontend when attempting to fetch data.\nACCEPTED ANSWER: Install the cors package: npm install cors. Use it as middleware: app.use(cors()). You can also customize origins, allowed headers, and methods.',
    time_spent: 45
  },
  {
    url: 'https://stackoverflow.com/questions/43210/react-hook-useeffect-has-missing-dependency',
    title: 'React Hook useEffect has a missing dependency warning',
    source_type: 'stackoverflow',
    domain: 'stackoverflow.com',
    topics: ['react', 'useeffect', 'javascript', 'hooks'],
    summary: 'Covers the React exhaustive-deps ESLint warning, explaining how to properly list dependencies in useEffect, use useCallback/useMemo, or safely disable warnings.',
    raw_content: 'QUESTION: Why does ESLint warn about missing dependencies in useEffect? how can I fix it?\nACCEPTED ANSWER: Include all variables referenced inside useEffect in the dependency array. If functions change on every render, wrap them in useCallback.',
    time_spent: 120
  },
  {
    url: 'https://stackoverflow.com/questions/87654/how-to-copy-directory-in-nodejs',
    title: 'How to copy a directory recursively in Node.js',
    source_type: 'stackoverflow',
    domain: 'stackoverflow.com',
    topics: ['nodejs', 'filesystem', 'javascript', 'backend'],
    summary: 'Demonstrates methods for copying directories recursively in Node.js using fs.cpSync in newer versions, or custom recursive directory traversal in older versions.',
    raw_content: 'QUESTION: What is the cleanest way to recursively copy a folder in Node.js?\nACCEPTED ANSWER: In Node 16.7+, you can use fs.cpSync(src, dest, { recursive: true }). For older versions, use fs.readdirSync and recursively copy files.',
    time_spent: 30
  },
  {
    url: 'https://stackoverflow.com/questions/65432/postgresql-duplicate-key-violates-unique-constraint',
    title: 'PostgreSQL duplicate key violates unique constraint error',
    source_type: 'stackoverflow',
    domain: 'stackoverflow.com',
    topics: ['postgresql', 'database', 'sql', 'debugging'],
    summary: 'Explains how to fix unique constraint violations in PostgreSQL, typically caused by out-of-sync auto-incrementing primary key sequences.',
    raw_content: 'QUESTION: I get "duplicate key value violates unique constraint" on my primary key index. Why?\nACCEPTED ANSWER: Your sequence is out of sync with the actual max ID in the table. Fix it using: SELECT setval(pg_get_serial_sequence(\'table\', \'id\'), COALESCE(max(id), 0)+1, false) FROM table;',
    time_spent: 75
  },
  {
    url: 'https://stackoverflow.com/questions/98765/git-undo-last-commit-before-push',
    title: 'How to undo last commit in Git before pushing',
    source_type: 'stackoverflow',
    domain: 'stackoverflow.com',
    topics: ['git', 'version-control', 'cli'],
    summary: 'Shares git reset commands for undoing local commits, explaining the differences between soft, mixed, and hard resets.',
    raw_content: 'QUESTION: I made a local commit but realized I made a mistake. How can I undo it without losing my files?\nACCEPTED ANSWER: Use git reset --soft HEAD~1. This undoes the commit but leaves your changes staged in the working directory.',
    time_spent: 20
  },
  {
    url: 'https://stackoverflow.com/questions/34567/css-flexbox-space-between-last-row-alignment',
    title: 'CSS flexbox space-between last row alignment issues',
    source_type: 'stackoverflow',
    domain: 'stackoverflow.com',
    topics: ['css', 'flexbox', 'frontend', 'layout'],
    summary: 'Fixes the grid alignment issue in CSS Flexbox when justify-content is space-between and the last row has fewer items, using empty spacer elements or CSS Grid instead.',
    raw_content: 'QUESTION: How do I align items to the left on the last row of a flex container with space-between?\nACCEPTED ANSWER: Flexbox doesn\'t support this natively. You can add invisible placeholder elements with 0 height, or switch to CSS Grid.',
    time_spent: 50
  },
  {
    url: 'https://stackoverflow.com/questions/12121/docker-port-forwarding-not-working-on-localhost',
    title: 'Docker port forwarding not working on localhost',
    source_type: 'stackoverflow',
    domain: 'stackoverflow.com',
    topics: ['docker', 'localhost', 'port-forwarding', 'networking'],
    summary: 'Troubleshoots common causes of Docker port binding failures, including using localhost instead of 0.0.0.0 inside the container, or local port conflicts.',
    raw_content: 'QUESTION: My docker run -p 8080:80 is running, but I can\'t access it via localhost:8080. Why?\nACCEPTED ANSWER: Ensure your server inside the container is binding to 0.0.0.0 and not 127.0.0.1. Also check if port 8080 is already in use.',
    time_spent: 90
  },
  {
    url: 'https://stackoverflow.com/questions/99887/typescript-index-signature-error',
    title: 'TypeScript Element implicitly has an any type (index signature)',
    source_type: 'stackoverflow',
    domain: 'stackoverflow.com',
    topics: ['typescript', 'javascript', 'types'],
    summary: 'Resolves index signature errors when accessing object properties dynamically in TypeScript, using keyof casting or defining explicit index types.',
    raw_content: 'QUESTION: How do I fix "Element implicitly has an \'any\' type because expression of type \'string\' can\'t be used to index type"?\nACCEPTED ANSWER: Define an index signature on your interface like [key: string]: any, or cast the key using: obj[key as keyof typeof obj].',
    time_spent: 60
  },
  {
    url: 'https://stackoverflow.com/questions/88776/mongodb-connection-timeout-on-atlas',
    title: 'MongoDB Atlas connection timeout troubleshooting',
    source_type: 'stackoverflow',
    domain: 'stackoverflow.com',
    topics: ['mongodb', 'database', 'cloud', 'atlas'],
    summary: 'Fixes connection timeouts to MongoDB Atlas by configuring IP access lists (IP whitelist) and verifying connection string syntax.',
    raw_content: 'QUESTION: I keep getting connection timeout when connecting to Atlas from my Node app. Why?\nACCEPTED ANSWER: Usually this is an IP Whitelist issue. Go to MongoDB Atlas console -> Network Access -> Add IP Address, and whitelist your current IP.',
    time_spent: 40
  },
  {
    url: 'https://stackoverflow.com/questions/77665/how-to-run-multiple-npm-scripts-parallel',
    title: 'How to run multiple npm scripts in parallel',
    source_type: 'stackoverflow',
    domain: 'stackoverflow.com',
    topics: ['npm', 'package.json', 'cli', 'scripts'],
    summary: 'Discusses tools like concurrently and npm-run-all for executing multiple development servers or watchers in a single terminal shell.',
    raw_content: 'QUESTION: I want to run my frontend and backend servers together. How can I run npm start on both simultaneously?\nACCEPTED ANSWER: Install the concurrently package: npm install -g concurrently. Then configure package.json: concurrently "npm run server" "npm run client".',
    time_spent: 35
  },
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
    title: 'Promise - JavaScript | MDN',
    source_type: 'mdn',
    domain: 'developer.mozilla.org',
    topics: ['javascript', 'promise', 'async', 'mdn'],
    summary: 'The MDN reference for JavaScript Promises. Covers promise states (pending, fulfilled, rejected), chaining (.then, .catch, .finally), and composition methods.',
    raw_content: 'A Promise is a proxy for a value not necessarily known when the promise is created. It allows you to associate handlers with an asynchronous action\'s eventual success value or failure reason.',
    time_spent: 180
  },
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector',
    title: 'Document.querySelector() - Web APIs | MDN',
    source_type: 'mdn',
    domain: 'developer.mozilla.org',
    topics: ['javascript', 'dom', 'browser', 'mdn'],
    summary: 'Reference guide for querySelector, explaining how it selects the first DOM element matching standard CSS selector strings.',
    raw_content: 'The Document method querySelector() returns the first Element within the document that matches the specified group of selectors. If no matches are found, null is returned.',
    time_spent: 30
  },
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status',
    title: 'HTTP response status codes - HTTP | MDN',
    source_type: 'mdn',
    domain: 'developer.mozilla.org',
    topics: ['http', 'api', 'networking', 'mdn'],
    summary: 'A reference index of all standard HTTP response status codes categorized by groups (informational, success, redirects, client errors, server errors).',
    raw_content: 'HTTP response status codes indicate whether a specific HTTP request has been successfully completed. Responses are grouped in five classes: 1xx, 2xx, 3xx, 4xx, and 5xx.',
    time_spent: 90
  },
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout',
    title: 'CSS Grid Layout - CSS | MDN',
    source_type: 'mdn',
    domain: 'developer.mozilla.org',
    topics: ['css', 'grid', 'layout', 'mdn'],
    summary: 'Comprehensive guide to CSS Grid, detailing columns, rows, areas, tracks, grid-template properties, and grid item positioning rules.',
    raw_content: 'CSS Grid Layout excels at dividing a page into major regions or defining the relationship in terms of size, position, and layer, between parts of a control built from HTML primitives.',
    time_spent: 150
  },
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage',
    title: 'Window.localStorage - Web APIs | MDN',
    source_type: 'mdn',
    domain: 'developer.mozilla.org',
    topics: ['javascript', 'storage', 'browser', 'mdn'],
    summary: 'Details local storage mechanisms in browsers, explaining its key-value structure, string serialization requirements, and 5MB storage limit.',
    raw_content: 'The read-only localStorage property allows you to access a Storage object for the Document\'s origin; the stored data is saved across browser sessions.',
    time_spent: 45
  },
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout',
    title: 'CSS Flexible Box Layout - CSS | MDN',
    source_type: 'mdn',
    domain: 'developer.mozilla.org',
    topics: ['css', 'flexbox', 'layout', 'mdn'],
    summary: 'Explains Flexbox principles, including the main axis, cross axis, alignment properties (justify-content, align-items), and item flex growth behaviors.',
    raw_content: 'CSS Flexible Box Layout is a 1D layout method for laying out items in rows or columns. Items flex to fill additional space and shrink to fit into smaller spaces.',
    time_spent: 80
  },
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce',
    title: 'Array.prototype.reduce() - JavaScript | MDN',
    source_type: 'mdn',
    domain: 'developer.mozilla.org',
    topics: ['javascript', 'array', 'functional-programming', 'mdn'],
    summary: 'Technical explanation of Array.reduce(). Covers accumulators, initial values, and common use cases such as grouping objects, summing values, and flattening lists.',
    raw_content: 'The reduce() method of Array instances executes a user-supplied "reducer" callback function on each element of the array, in order, passing in the return value from the calculation on the preceding element.',
    time_spent: 130
  },
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function',
    title: 'async function expression - JavaScript | MDN',
    source_type: 'mdn',
    domain: 'developer.mozilla.org',
    topics: ['javascript', 'async', 'promise', 'mdn'],
    summary: 'Details the async/await keyword wrapper for promises, describing asynchronous function execution flows and try/catch error handling.',
    raw_content: 'The async function declaration declares an async function where the await keyword is permitted within the function body. The async and await keywords enable asynchronous, promise-based behavior to be written in a cleaner style.',
    time_spent: 70
  },
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
    title: 'Cross-Origin Resource Sharing (CORS) - HTTP | MDN',
    source_type: 'mdn',
    domain: 'developer.mozilla.org',
    topics: ['http', 'cors', 'security', 'mdn'],
    summary: 'Deep dive into CORS protocols, explaining simple requests, preflight OPTIONS requests, response headers (Access-Control-Allow-Origin), and credential handling.',
    raw_content: 'CORS is an HTTP-header based mechanism that allows a server to indicate any origins other than its own from which a browser should permit loading resources.',
    time_spent: 160
  },
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API',
    title: 'WebSockets API - Web APIs | MDN',
    source_type: 'mdn',
    domain: 'developer.mozilla.org',
    topics: ['http', 'websockets', 'networking', 'mdn'],
    summary: 'Details the HTML5 WebSockets standard, highlighting two-way real-time persistent connections bypassing standard HTTP request/response loops.',
    raw_content: 'The WebSockets API is a technology that makes it possible to open a two-way interactive communication session between the user\'s browser and a server. With this API, you can send messages to a server and receive event-driven responses without having to poll.',
    time_spent: 110
  },
  {
    url: 'https://github.com/react-router/react-router/issues/1029',
    title: 'issue: Memory leak in react-router-dom v6 on dynamic routes',
    source_type: 'github',
    domain: 'github.com',
    topics: ['react', 'react-router', 'memory-leak', 'github'],
    summary: 'A GitHub issue discussing a memory leak in dynamic routers. Suggests upgrading React Router or refactoring route listener hooks to avoid leaking listeners.',
    raw_content: 'GitHub Issue: Memory leak observed when mounting and unmounting dynamic route pages. After research, it was found that the path parser cache accumulates entries. Resolved in patch release 6.4.1.',
    time_spent: 65
  },
  {
    url: 'https://github.com/vercel/next.js/issues/4890',
    title: 'issue: Next.js dev server hot reload slow on large bundles',
    source_type: 'github',
    domain: 'github.com',
    topics: ['nextjs', 'webpack', 'dev-server', 'github'],
    summary: 'Vercel repository issue troubleshooting slow Fast Refresh in Next.js. Recommends configuring exclusions for large assets or switching to the Rust-based Turbopack.',
    raw_content: 'GitHub Issue: HMR takes up to 8 seconds on small page changes. Solved by increasing Node.js max-old-space-size and disabling source maps in development settings.',
    time_spent: 140
  },
  {
    url: 'https://github.com/prisma/prisma/issues/3321',
    title: 'issue: prisma client connection pool exhausted under high load',
    source_type: 'github',
    domain: 'github.com',
    topics: ['prisma', 'postgresql', 'database', 'github'],
    summary: 'Investigates connection pooling limits in Prisma. Discusses setting connection_limit in the URL string and managing prisma client instances as singletons.',
    raw_content: 'GitHub Issue: Getting error "PrismaClientInitializationError: Connection pool limit reached". Fix: Ensure only a single instance of PrismaClient is created globally in dev, and adjust connection_limit=20.',
    time_spent: 100
  },
  {
    url: 'https://github.com/tailwindlabs/tailwindcss/issues/5422',
    title: 'issue: tailwindcss build fails with postcss 8 compatibility',
    source_type: 'github',
    domain: 'github.com',
    topics: ['css', 'tailwindcss', 'postcss', 'github'],
    summary: 'Troubleshoots peer dependency collisions when compiling Tailwind v2/v3 styles using older PostCSS compilers, proposing compatibility scripts.',
    raw_content: 'GitHub Issue: Webpack build fails with PostCSS error. Resolving by installing tailwindcss@compat build or upgrading local autoprefixer and postcss dependencies.',
    time_spent: 50
  },
  {
    url: 'https://github.com/docker/compose/issues/6102',
    title: 'issue: docker-compose depends_on healthcheck timing issues',
    source_type: 'github',
    domain: 'github.com',
    topics: ['docker', 'docker-compose', 'devops', 'github'],
    summary: 'Discusses Docker Compose startup synchronization. Shows how to use the condition: service_healthy flag to delay service starts until DB ports are verified.',
    raw_content: 'GitHub Issue: App crashes because DB container is starting up too slowly. Fix: Add a healthcheck block to DB container, and set depends_on: db: condition: service_healthy on App container.',
    time_spent: 85
  },
  {
    url: 'https://github.com/remy/nodemon/issues/2349',
    title: 'issue: nodemon crashing on syntax errors in node 20',
    source_type: 'github',
    domain: 'github.com',
    topics: ['nodemon', 'nodejs', 'scripts', 'github'],
    summary: 'Troubleshoots nodemon process termination when loading invalid javascript. Suggests enabling nodemon --crash-recovery flag.',
    raw_content: 'GitHub Issue: nodemon exits completely instead of waiting for file changes when a syntax error is saved. Temporary workaround: use nodemon --exitcrash or check nodemon config.',
    time_spent: 30
  },
  {
    url: 'https://github.com/axios/axios/issues/9222',
    title: 'issue: axios interceptor request retry loop on 401',
    source_type: 'github',
    domain: 'github.com',
    topics: ['axios', 'api', 'security', 'github'],
    summary: 'Addresses infinite loops inside Axios response interceptors trying to refresh tokens, recommending check flags to isolate token renewal requests.',
    raw_content: 'GitHub Issue: Attempting to refresh expired JWT token inside Axios interceptor triggers infinite request loop. Fix: Add a _retry flag on the original request config to ensure it only retries once.',
    time_spent: 95
  },
  {
    url: 'https://github.com/typescript-eslint/typescript-eslint/issues/4512',
    title: 'issue: eslint rules for typescript imports and exports',
    source_type: 'github',
    domain: 'github.com',
    topics: ['eslint', 'typescript', 'cli', 'github'],
    summary: 'Discussion around configuring ESLint to enforce consistent type imports and path alias resolutions in TypeScript monorepos.',
    raw_content: 'GitHub Issue: ESLint fails on import path alias configurations. Fixed by setting up eslint-import-resolver-typescript parser options in eslintrc.',
    time_spent: 55
  },
  {
    url: 'https://github.com/socketio/socket.io/issues/7411',
    title: 'issue: socket.io websocket handshake failed due to CORS',
    source_type: 'github',
    domain: 'github.com',
    topics: ['socketio', 'cors', 'networking', 'github'],
    summary: 'Resolves socket connection rejections on startup by adding explicit cors configurations inside Socket.IO v4 creation constructor options.',
    raw_content: 'GitHub Issue: WebSockets fail to connect. In Socket.io v3/v4, you must configure CORS explicitly on server instantiation: const io = new Server(http, { cors: { origin: "*" } }).',
    time_spent: 70
  },
  {
    url: 'https://github.com/jestjs/jest/issues/8821',
    title: 'issue: jest unit tests memory leak on large test suites',
    source_type: 'github',
    domain: 'github.com',
    topics: ['testing', 'jest', 'memory-leak', 'github'],
    summary: 'Identifies memory leak patterns in Jest test runners caused by cache retaining and offers config recommendations like jest --logHeapUsage.',
    raw_content: 'GitHub Issue: Jest runs out of memory on CI pipelines. Mitigated by using node --expose-gc or running Jest with --runInBand flag to isolate test execution contexts.',
    time_spent: 125
  },
  {
    url: 'https://dev.to/devguy/clean-architecture-in-nodejs-2e4a',
    title: 'Clean Architecture in Node.js - Dev.to',
    source_type: 'devto',
    domain: 'dev.to',
    topics: ['architecture', 'nodejs', 'design-patterns', 'devto'],
    summary: 'Overview of Uncle Bob\'s Clean Architecture mapped to Node.js folders. Explains boundaries, dependency injection, and separating entities from frameworks.',
    raw_content: 'Clean architecture organizes code into concentric layers: Entities, Use Cases, Controllers, and External Gateways. The main rule is that dependencies must only point inwards, protecting business logic from changes in databases or UI.',
    time_spent: 155
  },
  {
    url: 'https://dev.to/cssdesign/mastering-css-transitions-and-animations-18df',
    title: 'Mastering CSS Transitions and Animations - Dev.to',
    source_type: 'devto',
    domain: 'dev.to',
    topics: ['css', 'animations', 'frontend', 'devto'],
    summary: 'Practical guide to CSS transitions, animations, cubic-bezier timing curves, hardware acceleration hacks, and performance-friendly animatable properties.',
    raw_content: 'Use CSS transition: transform 0.3s ease-in-out for smooth animations. Prefer transform and opacity over top, left, width, or height since they trigger layouts/paints instead of compositions.',
    time_spent: 90
  },
  {
    url: 'https://dev.to/reactdev/react-server-components-a-deep-dive-4h2a',
    title: 'React Server Components: A Deep Dive - Dev.to',
    source_type: 'devto',
    domain: 'dev.to',
    topics: ['react', 'rsc', 'nextjs', 'devto'],
    summary: 'Details React Server Components (RSC). Explains the client/server boundaries, hydration differences, performance gains, and database queries inside components.',
    raw_content: 'React Server Components load data directly on the server, sending pre-rendered HTML and client scripts instead of full JS bundles, significantly improving initial page load times and reducing bundle sizes.',
    time_spent: 210
  },
  {
    url: 'https://dev.to/tsdev/why-you-should-use-typescript-in-2026-11f8',
    title: 'Why You Should Use TypeScript in 2026 - Dev.to',
    source_type: 'devto',
    domain: 'dev.to',
    topics: ['typescript', 'javascript', 'productivity', 'devto'],
    summary: 'Highlights key compile-time protection benefits of TypeScript, listing features like template literal types, satisfying assertions, and autocomplete gains.',
    raw_content: 'TypeScript reduces runtime production errors by catching type errors at compile time. It acts as living documentation and drastically increases developer velocity with robust IDE refactoring capabilities.',
    time_spent: 60
  },
  {
    url: 'https://dev.to/backendguy/building-a-rest-api-with-express-and-prisma-3a1b',
    title: 'Building a REST API with Express and Prisma - Dev.to',
    source_type: 'devto',
    domain: 'dev.to',
    topics: ['express', 'prisma', 'database', 'api', 'devto'],
    summary: 'Step-by-step tutorial on building a CRUD API using Express Router, Prisma Schema, Postgres database, validation, and error middlewares.',
    raw_content: 'In this guide, we setup Prisma schema, migrate a database, generate the client, and write express request handlers to query database records dynamically using async/await syntax.',
    time_spent: 120
  },
  {
    url: 'https://dev.to/gitmaster/top-10-git-commands-every-dev-should-know-2f3a',
    title: 'Top 10 Git Commands Every Dev Should Know - Dev.to',
    source_type: 'devto',
    domain: 'dev.to',
    topics: ['git', 'version-control', 'cli', 'devto'],
    summary: 'Explains lesser-known Git commands like git reflog, cherry-pick, stash pop, revert, and interactive rebasing to help solve command-line errors.',
    raw_content: 'Commands covered: git reflog (recover deleted commits), git cherry-pick (move single commit to branch), git add -p (stage partial chunks), and git commit --amend.',
    time_spent: 45
  },
  {
    url: 'https://dev.to/dockerdev/an-introduction-to-docker-containerization-55fa',
    title: 'An Introduction to Docker Containerization - Dev.to',
    source_type: 'devto',
    domain: 'dev.to',
    topics: ['docker', 'devops', 'deployment', 'devto'],
    summary: 'An introductory post explaining Docker containers, images, Dockerfiles, caching layers, containerized storage volumes, and network setups.',
    raw_content: 'Docker packages software into isolated containers containing code, runtime, system libraries, and settings. This eliminates the "works on my machine" problem.',
    time_spent: 105
  },
  {
    url: 'https://dev.to/webperformance/optimizing-web-performance-in-react-44aa',
    title: 'Optimizing Web Performance in React - Dev.to',
    source_type: 'devto',
    domain: 'dev.to',
    topics: ['react', 'performance', 'webpack', 'devto'],
    summary: 'Examines code-splitting (React.lazy), component memoization (React.memo), debounce strategies, virtualization, and profiling rendering performance.',
    raw_content: 'Key metrics to watch are Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS). Optimize React performance using dynamic imports, virtualized lists, and state throttling.',
    time_spent: 145
  },
  {
    url: 'https://dev.to/sqldev/a-guide-to-sql-joins-for-beginners-34cc',
    title: 'A Guide to SQL Joins for Beginners - Dev.to',
    source_type: 'devto',
    domain: 'dev.to',
    topics: ['sql', 'database', 'query', 'devto'],
    summary: 'Visual tutorial on SQL inner join, left join, right join, and full outer join, along with examples using database table indexes.',
    raw_content: 'SQL Joins are used to combine rows from two or more tables based on a related column. This guide illustrates query outputs using Venn diagrams and standard postgres syntax.',
    time_spent: 75
  },
  {
    url: 'https://dev.to/authguy/understanding-jwt-authentication-1212',
    title: 'Understanding JWT Authentication - Dev.to',
    source_type: 'devto',
    domain: 'dev.to',
    topics: ['jwt', 'security', 'authentication', 'devto'],
    summary: 'Examines JSON Web Tokens (JWT), explaining how headers, payloads, signatures, and cryptographic secrets secure stateless user logins.',
    raw_content: 'JWTs are stateless security credentials. The client stores the token in local storage or HTTP-only cookies and sends it as a Bearer authorization header for API requests.',
    time_spent: 95
  },
  {
    url: 'https://medium.com/system-design/scaling-to-10m-users-db4f8d38891a',
    title: 'System Design: Scaling to 10M Users - Medium',
    source_type: 'medium',
    domain: 'medium.com',
    topics: ['architecture', 'scaling', 'system-design', 'medium'],
    summary: 'Chronicles architectural iterations to support millions of users, introducing database replicas, content delivery networks (CDNs), and load balancers.',
    raw_content: 'To scale to 10M users, migrate from a single instance to a decoupled architecture: add horizontal scaling, set up a CDN for static assets, introduce Redis cache, and partition SQL databases.',
    time_spent: 240
  },
  {
    url: 'https://medium.com/software-engineering/microservices-design-patterns-4a11f23dd22c',
    title: 'Microservices Design Patterns - Medium',
    source_type: 'medium',
    domain: 'medium.com',
    topics: ['architecture', 'microservices', 'design-patterns', 'medium'],
    summary: 'Explores microservices patterns including API Gateways, Saga patterns for distributed transactions, CQRS, and Circuit Breakers.',
    raw_content: 'Microservices decouple systems for scalability. Implement Circuit Breaker patterns (like resilience4j) to prevent cascading system failures when downstream service requests timeout.',
    time_spent: 190
  },
  {
    url: 'https://medium.com/frontend/the-future-of-frontend-frameworks-71a2cdb3f11d',
    title: 'The Future of Frontend Frameworks - Medium',
    source_type: 'medium',
    domain: 'medium.com',
    topics: ['frontend', 'react', 'trends', 'medium'],
    summary: 'Compares React, Vue, Svelte, and SolidJS. Highlights reactivity engines, compiler-driven framework shifts, and fine-grained DOM bindings.',
    raw_content: 'We are moving away from heavy Virtual DOM reconciliation. Modern frameworks use compilers to update DOM elements directly, reducing client runtime sizes.',
    time_spent: 115
  },
  {
    url: 'https://medium.com/database/postgresql-indexing-best-practices-23d8c11e2f3d',
    title: 'PostgreSQL Indexing Best Practices - Medium',
    source_type: 'medium',
    domain: 'medium.com',
    topics: ['postgresql', 'database', 'performance', 'medium'],
    summary: 'Investigates index optimization in Postgres, comparing B-Tree, GIN, Hash, and partial indexes, and analyzing database query execution plans.',
    raw_content: 'Avoid over-indexing as it slows down inserts. Use EXPLAIN ANALYZE to verify query plans. Create partial indexes (e.g. index where active = true) for smaller footprints.',
    time_spent: 165
  },
  {
    url: 'https://medium.com/redis/redis-caching-strategies-a2b1cc3e4d5a',
    title: 'Redis Caching Strategies: Cache-Aside vs Write-Through - Medium',
    source_type: 'medium',
    domain: 'medium.com',
    topics: ['redis', 'caching', 'performance', 'medium'],
    summary: 'Compares Cache-Aside, Write-Through, Write-Behind, and eviction policies (LRU, LFU) to maintain low database latency.',
    raw_content: 'Cache-Aside is the most popular caching pattern. The application queries the cache first. If a cache miss occurs, it queries the database and writes the result back to Redis.',
    time_spent: 135
  },
  {
    url: 'https://medium.com/typescript/advanced-typescript-patterns-d8d4c3f5e2d1',
    title: 'Advanced TypeScript Patterns for Library Creators - Medium',
    source_type: 'medium',
    domain: 'medium.com',
    topics: ['typescript', 'javascript', 'design-patterns', 'medium'],
    summary: 'Covers complex type constructs in TS, including conditional types, mapped types, utility types, and generic parameter inference.',
    raw_content: 'Using advanced patterns like return types extraction and conditional type assertions, developers can create type-safe interfaces that adapt dynamically to runtime inputs.',
    time_spent: 145
  },
  {
    url: 'https://medium.com/aws/aws-lambda-vs-ecs-for-hosting-apps-8c2f1f0a3e8b',
    title: 'AWS Lambda vs ECS for Hosting Web Applications - Medium',
    source_type: 'medium',
    domain: 'medium.com',
    topics: ['aws', 'cloud', 'deployment', 'medium'],
    summary: 'Compares serverless Lambda triggers to containerized ECS/Fargate services, considering execution timeouts, cold starts, and cost factors.',
    raw_content: 'AWS Lambda is perfect for event-driven workflows and erratic workloads. For steady, high-throughput APIs, ECS Fargate offers predictable billing and avoids cold-start issues.',
    time_spent: 175
  },
  {
    url: 'https://medium.com/devops/cicd-pipelines-with-github-actions-2b21c43f5a11',
    title: 'CI/CD Pipelines with GitHub Actions - Medium',
    source_type: 'medium',
    domain: 'medium.com',
    topics: ['devops', 'github-actions', 'automation', 'medium'],
    summary: 'Step-by-step guide to writing GitHub Action workflows. Covers YAML triggers, matrix builds, job dependencies, environments, and secrets variables.',
    raw_content: 'GitHub Actions automates builds, tests, and deployments. Build secure workflows by utilizing dynamic environment secrets and caching npm packages to reduce CI duration.',
    time_spent: 110
  },
  {
    url: 'https://medium.com/testing/unit-testing-vs-integration-testing-7f8e91d8a11e',
    title: 'Unit Testing vs Integration Testing: Striking the Balance - Medium',
    source_type: 'medium',
    domain: 'medium.com',
    topics: ['testing', 'architecture', 'methodology', 'medium'],
    summary: 'Examines the testing pyramid model. Compares isolating functions (mocking imports) to verifying joint service interfaces (DB, third-party API clients).',
    raw_content: 'Unit tests run quickly and isolate bugs in functions. Integration tests confirm that sub-systems work together. Maintain a healthy testing pyramid (70% unit, 20% integration, 10% E2E).',
    time_spent: 120
  },
  {
    url: 'https://medium.com/api/designing-restful-apis-rules-of-thumb-8a12f6b8c9d2',
    title: 'Designing RESTful APIs: Rules of Thumb - Medium',
    source_type: 'medium',
    domain: 'medium.com',
    topics: ['api', 'rest', 'design-patterns', 'medium'],
    summary: 'A set of best practices for API design, detailing HTTP verb semantics, path nesting limits, pagination techniques, versioning, and JSON body formats.',
    raw_content: 'Design clear API path structures: use plural nouns, nesting for relationships (e.g. /users/1/posts), HTTP GET for reads, POST for creation, and standard JSON error envelopes.',
    time_spent: 130
  }
];

async function seedLocal() {
  console.log('🌱 Starting local database seed...');
  const Database = require('better-sqlite3');
  const DB_PATH = path.join(__dirname, '../data/brain.db');
  
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }

  const db = new Database(DB_PATH);
  
  // Make sure tables exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      url TEXT UNIQUE NOT NULL,
      title TEXT,
      source_type TEXT,
      domain TEXT,
      topics TEXT,
      summary TEXT,
      raw_content TEXT,
      word_count INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      captured_at TEXT DEFAULT (datetime('now')),
      last_accessed TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 1,
      last_seen TEXT DEFAULT (datetime('now'))
    );
  `);

  const insertPage = db.prepare(`
    INSERT OR REPLACE INTO pages (id, url, title, source_type, domain, topics, summary, raw_content, word_count, time_spent, captured_at, last_accessed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const insertTopic = db.prepare(`
    INSERT INTO topics (name, count, last_seen)
    VALUES (?, 1, datetime('now'))
    ON CONFLICT(name) DO UPDATE SET count = count + 1, last_seen = datetime('now')
  `);

  let count = 0;
  for (const page of mockPages) {
    const id = `mock-page-id-${count + 1}`;
    const wordCount = page.raw_content.split(/\s+/).length;
    
    // Insert page
    insertPage.run(
      id,
      page.url,
      page.title,
      page.source_type,
      page.domain,
      JSON.stringify(page.topics),
      page.summary,
      page.raw_content,
      wordCount,
      page.time_spent
    );

    // Insert topics
    for (const topic of page.topics) {
      insertTopic.run(topic.toLowerCase());
    }

    count++;
  }

  console.log(`✅ Local database seeded successfully with ${count} pages!`);
  db.close();
}

async function seedRemote(url) {
  console.log(`📡 Starting remote API seed to: ${url}`);
  const endpoint = `${url.replace(/\/$/, '')}/api/ingest`;
  
  const secret = process.env.EXTENSION_SECRET || '';

  let count = 0;
  for (const page of mockPages) {
    process.stdout.write(`Ingesting [${count + 1}/50]: ${page.title.substring(0, 40)}... `);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Brain-Secret': secret
        },
        body: JSON.stringify({
          url: page.url,
          title: page.title,
          content: page.raw_content,
          timeSpent: page.time_spent
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅');
        count++;
      } else {
        console.log(`❌ (${result.reason || 'Failed'})`);
      }
    } catch (err) {
      console.log(`❌ (Error: ${err.message})`);
    }

    // Delay 150ms to prevent rate limiting or overloading
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\n🎉 Remote seed complete. Successfully added ${count} of 50 items.`);
}

async function main() {
  const args = process.argv.slice(2);
  const remoteIndex = args.indexOf('--remote');

  if (remoteIndex !== -1 && args[remoteIndex + 1]) {
    const remoteUrl = args[remoteIndex + 1];
    await seedRemote(remoteUrl);
  } else {
    await seedLocal();
  }
}

main().catch(console.error);
