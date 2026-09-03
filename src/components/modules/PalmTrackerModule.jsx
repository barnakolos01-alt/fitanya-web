2026-09-03T15:36:03.905Z	Initializing build environment...
2026-09-03T15:36:48.862Z	Success: Finished initializing build environment
2026-09-03T15:36:49.977Z	Cloning repository...
2026-09-03T15:36:54.342Z	No build output detected to cache. Skipping.
2026-09-03T15:36:54.343Z	No dependencies detected to cache. Skipping.
2026-09-03T15:36:54.348Z	Detected the following tools from environment: bun@1.2.15, nodejs@24.18.0
2026-09-03T15:36:54.353Z	Installing project dependencies: bun install
2026-09-03T15:36:03.905Z	Initializing build environment...
2026-09-03T15:36:48.862Z	Success: Finished initializing build environment
2026-09-03T15:36:49.977Z	Cloning repository...
2026-09-03T15:36:54.342Z	No build output detected to cache. Skipping.
2026-09-03T15:36:54.343Z	No dependencies detected to cache. Skipping.
2026-09-03T15:36:54.348Z	Detected the following tools from environment: bun@1.2.15, nodejs@24.18.0
2026-09-03T15:36:54.353Z	Installing project dependencies: bun install
2026-09-03T15:36:58.955Z	bun install v1.2.15 (df017990)
2026-09-03T15:36:58.965Z	Resolving dependencies
2026-09-03T15:36:59.886Z	Resolved, downloaded and extracted [370]
2026-09-03T15:37:03.308Z	Saved lockfile
2026-09-03T15:37:03.309Z	
2026-09-03T15:37:03.309Z	+ @vitejs/plugin-react@4.7.0 (v6.1.1 available)
2026-09-03T15:37:03.309Z	+ vite@6.4.3 (v8.2.2 available)
2026-09-03T15:37:03.309Z	+ lucide-react@0.344.0 (v1.40.0 available)
2026-09-03T15:37:03.309Z	+ react@18.3.1 (v19.2.8 available)
2026-09-03T15:37:03.309Z	+ react-dom@18.3.1 (v19.2.8 available)
2026-09-03T15:37:03.310Z	
2026-09-03T15:37:03.310Z	68 packages installed [4.38s]
2026-09-03T15:37:03.522Z	Executing user build command: npm run build
2026-09-03T15:37:08.762Z	
2026-09-03T15:37:08.763Z	> fitanya-web@1.0.0 build
2026-09-03T15:37:08.763Z	> vite build
2026-09-03T15:37:08.763Z	
2026-09-03T15:37:10.187Z	vite v6.4.3 building for production...
2026-09-03T15:37:10.289Z	transforming...
2026-09-03T15:37:12.327Z	✓ 1477 modules transformed.
2026-09-03T15:37:12.330Z	✗ Build failed in 2.10s
2026-09-03T15:37:12.331Z	error during build:
2026-09-03T15:37:12.331Z	src/PwaApp.jsx (5:7): "default" is not exported by "src/components/modules/PalmTrackerModule.jsx", imported by "src/PwaApp.jsx".
2026-09-03T15:37:12.331Z	file: /opt/buildhome/repo/src/PwaApp.jsx:5:7
2026-09-03T15:37:12.331Z	
2026-09-03T15:37:12.331Z	3: import { C, serif, sans } from "./styles/tokens";
2026-09-03T15:37:12.335Z	4: import CravingCopilot from "./components/modules/CravingCopilot";
2026-09-03T15:37:12.335Z	5: import PalmTrackerModule from "./components/modules/PalmTrackerModule";
2026-09-03T15:37:12.336Z	          ^
2026-09-03T15:37:12.336Z	6: import HydrationEngine from "./components/modules/HydrationEngine";
2026-09-03T15:37:12.336Z	7: import SettingsModal from "./components/ui/SettingsModal";
2026-09-03T15:37:12.336Z	
2026-09-03T15:37:12.336Z	    at getRollupError (file:///opt/buildhome/repo/node_modules/rollup/dist/es/shared/parseAst.js:317:41)
2026-09-03T15:37:12.336Z	    at error (file:///opt/buildhome/repo/node_modules/rollup/dist/es/shared/parseAst.js:313:42)
2026-09-03T15:37:12.337Z	    at Module.error (file:///opt/buildhome/repo/node_modules/rollup/dist/es/shared/node-entry.js:17230:16)
2026-09-03T15:37:12.337Z	    at Module.traceVariable (file:///opt/buildhome/repo/node_modules/rollup/dist/es/shared/node-entry.js:17663:29)
2026-09-03T15:37:12.337Z	    at ModuleScope.findVariable (file:///opt/buildhome/repo/node_modules/rollup/dist/es/shared/node-entry.js:15253:39)
2026-09-03T15:37:12.337Z	    at Identifier.bind (file:///opt/buildhome/repo/node_modules/rollup/dist/es/shared/node-entry.js:5213:40)
2026-09-03T15:37:12.337Z	    at Property.bind (file:///opt/buildhome/repo/node_modules/rollup/dist/es/shared/node-entry.js:2595:23)
2026-09-03T15:37:12.337Z	    at ObjectExpression.bind (file:///opt/buildhome/repo/node_modules/rollup/dist/es/shared/node-entry.js:2591:28)
2026-09-03T15:37:12.337Z	    at ArrayExpression.bind (file:///opt/buildhome/repo/node_modules/rollup/dist/es/shared/node-entry.js:2591:28)
2026-09-03T15:37:12.337Z	    at VariableDeclarator.bind (file:///opt/buildhome/repo/node_modules/rollup/dist/es/shared/node-entry.js:2595:23)
2026-09-03T15:37:12.408Z	Failed: error occurred while running build command
