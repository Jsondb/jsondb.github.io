# JsonDB website overhaul: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Jekyll site with an Astro + Starlight docs site for `jsondb-core` 1.1.16, with the new icon and indigo theme. Also finish the repository hygiene in #80.

**Architecture:** A static Starlight site at the repo root, built and deployed by a GitHub Actions workflow whose `build` job is the required PR check. Content is Markdown/MDX in `src/content/docs/`, and every Java snippet in it is compiled against the published 1.1.16 artifact in a scratch project. The `jsondb-core` hygiene work happens in a separate git worktree, so the other session's checkout of `jsondb-core` is never touched.

**Tech Stack:** Node 26 (LTS), Astro 7.4.12, @astrojs/starlight 0.43.1, starlight-links-validator 0.27.0, sharp 0.35.5, GitHub Actions, and JDK 17 (Homebrew) for the snippet check.

**Spec:** `docs/superpowers/specs/2026-11-16-website-overhaul-design.md`

## Global Constraints

- Document only what's published in `io.jsondb:jsondb-core:1.1.16`. Nothing from the CHANGELOG's *Unreleased* section (e.g. `setSyncFolderOnWrite` doesn't exist in 1.1.16).
- Source of truth for the API: `git -C ../jsondb-core show v1.1.16:<path>`, **never** the `jsondb-core` working tree, which another session is editing.
- Claims to quote exactly: Java 8 and later; Android **API 26+** (from `Readme.md` at v1.1.16); OSGi.
- Snippets for the Java 8 baseline use `Arrays.asList(...)`. `List.of(...)` appears only where a page says it needs Java 9+ or Android API 30+.
- Commits: identity `FarooqKhan <FarooqKhan@users.noreply.github.com>`, already set in each repo. **No `Co-Authored-By`, `Claude-Session` or any AI attribution in commits, PR titles, PR bodies or comments.**
- New source files (`.mjs`, `.ts`, `.css`, `.astro`) carry the MIT header with `Copyright (c) 2026 Farooq Khan`. Markdown content, JSON, YAML and SVG files don't.
- `LICENSE.txt` (Tim O'Brien's theme licence) is **left untouched**, and the PR asks Farooq what he wants there.
- npm commands always take `--cache /private/tmp/claude-501/-Users-farooq-work-a-jsondb-jsondb-github-io/50088a72-a02b-4efc-88aa-392f4834f688/scratchpad/npm-cache` and run with `allowed_domains: ["registry.npmjs.org"]`. The default `~/.npm` isn't writable in the sandbox.
- Bash: inline literal paths, no shell variables. Prefer `git -C <repo>` over `cd … &&`.
- Every PR has a "Where to look" section, says what it does **not** do, and is never merged by me.
- Repository settings (Pages source, branch protection, security alerts) change only after Farooq confirms each one in chat.

## File structure (site repo, after the work)

```
.github/workflows/deploy.yml     build on PR; build + deploy on push to master
.github/dependabot.yml           npm (grouped, weekly) + github-actions (weekly)
.gitignore                       node_modules/, dist/, .astro/
.nvmrc                           26
astro.config.mjs                 site URL, Starlight config, sidebar, head tags
package.json / package-lock.json
README.md                        what this repo is, local dev, how deploys work
scripts/build-icons.mjs          SVG → favicon.ico, apple-touch-icon.png, og.png
src/assets/logo.svg              large artwork (≥48 px)
src/assets/logo-small.svg        small artwork (≤32 px); header logo
src/assets/logo-mono.svg         monochrome, currentColor
src/components/SiteTitle.astro   overrides Starlight's title: mark + "Json<b>DB</b>"
src/components/CodeAndFile.astro landing demo: Java on the left, users.json on the right
src/content.config.ts            docsLoader() + docsSchema()
src/content/docs/index.mdx       splash landing page
src/content/docs/start/*.md(x)   introduction, installation, quick-start
src/content/docs/guides/*.md(x)  11 guides
src/content/docs/reference/*.md  xpath-cheatsheet, upgrading, security
src/styles/theme.css             indigo/zinc tokens and landing-page styling
public/favicon.svg, favicon.ico, apple-touch-icon.png, og.png
docs/superpowers/…               spec and this plan (Astro ignores them)
LICENSE.txt                      unchanged
```

Removed: `_config.yml`, `Gemfile`, `Gemfile.lock`, `_posts/`, `_includes/`, `combo.css`, `site.js`, `feed.xml`, `index.html`, `img/`.

---

### Task 1: `jsondb-core` hygiene PR (Dependabot and issue forms)

**Files:** these are created in a **worktree**, not in the other session's checkout.
- Create: `.github/dependabot.yml`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Create the worktree from `origin/master`.**
  Run: `git -C /Users/farooq/work_a/jsondb/jsondb-core fetch origin master` (network: github.com), then `git -C /Users/farooq/work_a/jsondb/jsondb-core worktree add /private/tmp/claude-501/-Users-farooq-work-a-jsondb-jsondb-github-io/50088a72-a02b-4efc-88aa-392f4834f688/scratchpad/core-hygiene -b repo-hygiene origin/master`.
  Expected: a new directory on branch `repo-hygiene`. The other session's branch and working tree are unchanged.
- [ ] **Step 2: Write `.github/dependabot.yml`.**

```yaml
version: 2
updates:
  - package-ecosystem: gradle
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

- [ ] **Step 3: Write `bug_report.yml`.** It's an issue form (`name`, `description`, `labels: [bug]`) with these fields:
  - `jsondb-version`, input, required, placeholder `1.1.16`;
  - `java-version`, input, required, placeholder `17 (Temurin)`;
  - `platform`, dropdown: JVM (desktop/server), Android, OSGi, Other;
  - `android-api`, input, optional, "Android API level, if on Android";
  - `what-happened`, textarea, required;
  - `expected`, textarea, required;
  - `reproduce`, textarea, required, "Minimal code or steps. A failing JUnit test is ideal.", `render: java`;
  - `logs`, textarea, optional, `render: text`.
- [ ] **Step 4: Write `feature_request.yml`.** Labels `[enhancement]`. Fields: `problem` (required), `proposal` (required), `alternatives` (optional), and `jsondb-version` (optional).
- [ ] **Step 5: Write `config.yml`.** Set `blank_issues_enabled: true`, plus a `contact_links` entry "Documentation", pointing to https://jsondb.github.io.
- [ ] **Step 6: Validate the YAML.**
  Run: `ruby -ryaml -e 'ARGV.each { |f| YAML.load_file(f); puts "ok #{f}" }' <the four files>`
  Expected: four `ok` lines.
- [ ] **Step 7: Commit, push, open the PR.**
  - Commit message: `Add Dependabot for Gradle and issue forms for bugs and feature requests.`
  - Push with `git push -u origin repo-hygiene` (network: github.com).
  - `gh pr create -R Jsondb/jsondb-core`. The body has "Where to look" (all four files: skim; the bug form's required fields are the part to check), says it doesn't enable security alerts (a settings change, asked separately), and adds "Part of #80".
- [ ] **Step 8: Remove the worktree after the PR is open.**
  Run: `git -C /Users/farooq/work_a/jsondb/jsondb-core worktree remove /private/tmp/claude-501/-Users-farooq-work-a-jsondb-jsondb-github-io/50088a72-a02b-4efc-88aa-392f4834f688/scratchpad/core-hygiene`. The branch stays on the remote.

### Task 2: Scaffold Starlight, remove Jekyll

**Files:**
- Delete: `_config.yml Gemfile Gemfile.lock _posts _includes combo.css site.js feed.xml index.html img`
- Create: `package.json`, `.nvmrc`, `.gitignore` (replacing the old one), `astro.config.mjs`, `src/content.config.ts`, `src/styles/theme.css`, `src/components/SiteTitle.astro`, `src/content/docs/index.mdx` (minimal for now)

**Produces:**
- npm scripts `dev`, `build`, `preview`, `icons`;
- the sidebar slugs used by every later task (listed in the config below);
- the CSS custom properties `--jdb-*` used by the landing page.

- [ ] **Step 1: `git rm -r` the Jekyll files listed above.**
- [ ] **Step 2: Write `package.json`.**

```json
{
  "name": "jsondb-website",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "icons": "node scripts/build-icons.mjs"
  },
  "dependencies": {
    "@astrojs/starlight": "0.43.1",
    "astro": "7.4.12",
    "sharp": "0.35.5"
  },
  "devDependencies": {
    "starlight-links-validator": "0.27.0"
  },
  "engines": { "node": ">=22.23.4" }
}
```

- [ ] **Step 3: Write the dotfiles.**
  - `.nvmrc` contains `26`.
  - `.gitignore` contains `node_modules/`, `dist/`, `.astro/` and `.DS_Store`.
- [ ] **Step 4: Write `src/content.config.ts`.** MIT header, then:

```ts
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
```

- [ ] **Step 5: Write `astro.config.mjs`.** MIT header, then:

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

const site = 'https://jsondb.github.io';

export default defineConfig({
  site,
  integrations: [
    starlight({
      title: 'JsonDB',
      description: 'An embedded Java database that stores its data as plain JSON files, with XPath queries and optional encryption.',
      logo: { src: './src/assets/logo-small.svg', alt: '' },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Jsondb/jsondb-core' }],
      editLink: { baseUrl: 'https://github.com/Jsondb/jsondb.github.io/edit/master/' },
      customCss: ['./src/styles/theme.css'],
      components: { SiteTitle: './src/components/SiteTitle.astro' },
      plugins: [starlightLinksValidator()],
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
        { tag: 'meta', attrs: { property: 'og:image', content: `${site}/og.png` } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
      sidebar: [
        { label: 'Start here', items: ['start/introduction', 'start/installation', 'start/quick-start'] },
        {
          label: 'Guides',
          items: [
            'guides/documents', 'guides/jsondbtemplate', 'guides/android-osgi', 'guides/crud',
            'guides/queries', 'guides/sorting-slicing', 'guides/find-and-modify', 'guides/encryption',
            'guides/schema-versions', 'guides/backup-restore', 'guides/file-change-listeners',
          ],
        },
        {
          label: 'Reference',
          items: [
            'reference/xpath-cheatsheet', 'reference/upgrading', 'reference/security',
            { label: 'Javadoc', link: 'https://javadoc.io/doc/io.jsondb/jsondb-core/1.1.16/', attrs: { target: '_blank' } },
            { label: 'Changelog', link: 'https://github.com/Jsondb/jsondb-core/blob/master/CHANGELOG.md', attrs: { target: '_blank' } },
            { label: 'Releases', link: 'https://github.com/Jsondb/jsondb-core/releases', attrs: { target: '_blank' } },
          ],
        },
      ],
    }),
  ],
});
```

  The "New" badges come from each page's frontmatter (`sidebar: { badge: { text: 'New', variant: 'tip' } }`), which Starlight applies to slug entries.
- [ ] **Step 6: Write `src/components/SiteTitle.astro`.** MIT header in an Astro frontmatter comment. It renders the configured logo image and the text `Json<span class="jdb-accent">DB</span>`, linking to `/`, with Starlight's own `.site-title` class and sizing so the header layout doesn't change. The logo comes from `Astro.locals.starlightRoute` (`siteTitleHref`). Check the prop and locals names in the installed `node_modules/@astrojs/starlight/components/SiteTitle.astro` and copy its structure.
- [ ] **Step 7: Write `src/styles/theme.css`** (MIT header). It sets Starlight's colour variables. Dark is the default `:root`; light uses `:root[data-theme='light']`.

```css
:root {
  --sl-color-accent-low: #312e81;
  --sl-color-accent: #6366f1;
  --sl-color-accent-high: #c7d2fe;
  --sl-color-white: #fafafa;
  --sl-color-gray-1: #f4f4f5;
  --sl-color-gray-2: #e4e4e7;
  --sl-color-gray-3: #a1a1aa;
  --sl-color-gray-4: #71717a;
  --sl-color-gray-5: #3f3f46;
  --sl-color-gray-6: #27272a;
  --sl-color-black: #09090b;
  --jdb-cyan: #67e8f9;
  --jdb-grad: linear-gradient(90deg, #a5b4fc, #67e8f9);
}
:root[data-theme='light'] {
  --sl-color-accent-low: #e0e7ff;
  --sl-color-accent: #4f46e5;
  --sl-color-accent-high: #3730a3;
  --sl-color-white: #18181b;
  --sl-color-gray-1: #27272a;
  --sl-color-gray-2: #3f3f46;
  --sl-color-gray-3: #52525b;
  --sl-color-gray-4: #a1a1aa;
  --sl-color-gray-5: #d4d4d8;
  --sl-color-gray-6: #f4f4f5;
  --sl-color-gray-7: #fafafa;
  --sl-color-black: #ffffff;
  --jdb-cyan: #0e7490;
  --jdb-grad: linear-gradient(90deg, #4f46e5, #0e7490);
}
.jdb-accent { color: var(--sl-color-text-accent); }
```

  Starlight's light theme also defines `--sl-color-gray-7`, so set it in light. Also check the variable list against the installed `dist/style/props.css` and add any accent or grey token that's missing.
- [ ] **Step 8: Write a minimal `src/content/docs/index.mdx`** with `title: JsonDB` and `template: splash`. Task 5 fills it in. Put a one-line `.md` page at every sidebar slug for now (title only) so the build resolves.
- [ ] **Step 9: Install and build.**
  - Run `npm install --cache <scratch npm-cache> --no-audit --no-fund`, then `npm run build`.
  - Expected: the build succeeds, `dist/index.html` exists, and the links validator reports no errors.
- [ ] **Step 10: Commit.** Message: `Replace the Jekyll site with an Astro Starlight scaffold.`

### Task 3: Icons

**Files:**
- Create: `src/assets/logo.svg`, `src/assets/logo-small.svg`, `src/assets/logo-mono.svg`, `public/favicon.svg`, `scripts/build-icons.mjs`
- Generate: `public/favicon.ico`, `public/apple-touch-icon.png`, `public/og.png`

**Consumes:** the geometry from the spec's Icon section, exactly as approved on the `icon-c-v2` screen (the C2 large, C3 small and M mono symbols).

- [ ] **Step 1: Write the three SVGs.**
  - Each is a standalone file with `viewBox="0 0 64 64"` and its own `<defs>` (gradient ids prefixed `jdb-` so they don't clash when inlined).
  - Paths are copied verbatim from the approved C2/C3/M symbols.
  - `logo-mono.svg` uses `fill`/`stroke="currentColor"`, with the band mask.
  - `public/favicon.svg` is a copy of `logo-small.svg`.
- [ ] **Step 2: Write `scripts/build-icons.mjs`** (MIT header). It uses `sharp`:
  - Render `logo-small.svg` to 16 and 32 px PNGs, and `logo.svg` to a 48 px PNG. Pack all three into `public/favicon.ico` with a small PNG-in-ICO writer (Windows Vista and later support PNG entries):

```js
function pngsToIco(pngs) { // pngs: [{ size, data: Buffer }]
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(data.length, o + 8); dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.data)]);
}
```

  - Render `logo.svg` to `public/apple-touch-icon.png` at 180 px. Flatten it onto `#4338ca`, because iOS shows a transparent background as black and applies its own corner mask.
  - Build `public/og.png` at 1200 × 630 from an SVG string:
    - a `#09090b` background, with a radial indigo glow at the top right and a cyan glow at the bottom left;
    - `logo.svg` inlined at 220 px on the left;
    - "Json" + "DB" in `#a5b4fc` at 96 px, weight 700, font family `Inter, 'Helvetica Neue', Arial, sans-serif`;
    - the tagline "An embedded Java database that's just JSON files" at 34 px in `#a1a1aa`;
    - "jsondb.github.io" at 26 px in `#71717a`.
- [ ] **Step 3: Generate.** Run `npm run icons`. Expected: the three files exist, and `file public/favicon.ico` reports "MS Windows icon resource - 3 icons".
- [ ] **Step 4: Check by eye.**
  - Use the Read tool to look at `public/og.png`, `public/apple-touch-icon.png`, and an 8× nearest-neighbour upscale of the 16 px PNG (written to scratch, not committed).
  - Check: the braces are clear of the tile edge, the band is visible at 16 px, and the og text doesn't overlap the logo.
  - If something looks wrong, fix the geometry and repeat Steps 3–4.
- [ ] **Step 5: Build and commit.** Run `npm run build`, then commit with `Add the new JsonDB icon, favicons and social card.`

### Task 4: Snippet verification harness (scratch, never committed)

**Files:**
- Create (scratch): `/private/tmp/claude-501/-Users-farooq-work-a-jsondb-jsondb-github-io/50088a72-a02b-4efc-88aa-392f4834f688/scratchpad/snippets/`, containing `build.gradle`, `settings.gradle`, the Gradle wrapper copied from `jsondb-core` (read-only copy), and `src/main/java/docs/*.java`.

**Produces:** a `verify` command that later tasks run after adding their snippets:
`JAVA_HOME=/opt/homebrew/opt/openjdk@17 /…/scratchpad/snippets/gradlew -p /…/scratchpad/snippets run`

- [ ] **Step 1: Copy the wrapper.** Copy `gradlew` and `gradle/wrapper/` from `/Users/farooq/work_a/jsondb/jsondb-core` with `cp`. This only reads `jsondb-core`.
- [ ] **Step 2: Write `build.gradle`.**

```groovy
plugins { id 'application' }
repositories { mavenCentral() }
dependencies {
  implementation 'io.jsondb:jsondb-core:1.1.16'
  runtimeOnly 'org.slf4j:slf4j-simple:2.0.17'
}
java { toolchain { languageVersion = JavaLanguageVersion.of(17) } }
tasks.withType(JavaCompile).configureEach { options.release = 8 }
application { mainClass = 'docs.RunAll' }
```

  Java 8 snippets compile with `--release 8`, so any Java 9+ API slipping into them fails the build. Pages that show `List.of` keep those lines in a separate `Java9Snippets.java` compiled by a second source set with `release = 9`.
- [ ] **Step 3: Write `docs/RunAll.java`.**
  - `main` creates a temp folder, then calls each `XxxSnippets.run(Path dbDir)` in turn, each with a fresh subfolder.
  - Each snippet class includes the doc's code **verbatim** and asserts what the doc claims, throwing `AssertionError` if a claim is false. For example: `count()` returns 2 after two inserts; `restore(…, true)` merges.
- [ ] **Step 4: Run once with an empty `RunAll`.**
  - Network: `repo.maven.apache.org`, `repo1.maven.org`, `services.gradle.org`, `downloads.gradle.org`.
  - Expected: BUILD SUCCESSFUL. This proves 1.1.16 resolves from Maven Central.

### Task 5: Landing page

**Files:**
- Modify: `src/content/docs/index.mdx`
- Create: `src/components/CodeAndFile.astro`
- Modify: `src/styles/theme.css` (landing-page section)

- [ ] **Step 1: Write the `index.mdx` frontmatter.**
  - `template: splash`.
  - `hero`:
    - `title: "A database that's <span class=\"jdb-grad\">just JSON files</span>"`;
    - `tagline`: the pitch paragraph from the layout screen;
    - `image: { file: ../../assets/logo.svg }`;
    - `actions`: "Get started" (`/start/quick-start/`, primary, `icon: right-arrow`) and "View on GitHub" (`https://github.com/Jsondb/jsondb-core`, minimal, `icon: external`).
  - Check that the hero title accepts HTML in Starlight 0.43 (`schemas/hero.js`). If it doesn't, use `HeroTitle` text without the span and apply the gradient with CSS on `.hero h1`.
- [ ] **Step 2: Write the body.**
  - A `<Badge text="v1.1.16 · Java 8+ · Android & OSGi" />` above the tabs.
  - `<Tabs syncKey="build">` with Gradle (`implementation "io.jsondb:jsondb-core:1.1.16"`) and Maven (the `<dependency>` block).
  - `<CardGrid>` with the six cards from the spec, using Starlight icons: `seti:json`, `magnifier`, `approve-check`, `random`, `download`, `rocket`.
  - `<CodeAndFile />`.
- [ ] **Step 3: Write `CodeAndFile.astro`.**
  - Two Starlight `<Code>` blocks side by side (stacked under 50rem): the Java `User` snippet and the matching `users.json`.
  - The JSON is whatever Task 4's harness actually writes. Run the snippet and paste the real file contents; don't invent the format.
- [ ] **Step 4: Add the snippet to the harness.** Add `LandingSnippets` to Task 4's harness, run `verify`, then run `npm run build`. Both must pass.
- [ ] **Step 5: Commit.** Message: `Add the landing page.`

### Tasks 6–9: Documentation pages

Each page follows the same cycle:
1. Read the listed source at `v1.1.16`.
2. Write the page.
3. Add its snippets verbatim to `docs/<Page>Snippets.java`, with assertions for every behavioural claim.
4. Run `verify`, then `npm run build`.
5. Commit each task's pages together.

Frontmatter on every page: `title`, `description` (one sentence), and, for 1.1.x additions, `sidebar: { badge: { text: 'New', variant: 'tip' } }`.

#### Task 6: Start here

- **`start/introduction.md`**
  - Sections: what JsonDB is (in-memory, with every write saved to `.json` files); good fits (config/state stores, desktop and Android apps, tests, small services); when *not* to use it (large datasets, multi-process writers, heavy concurrent write load, needs SQL or transactions); how it compares to "just use a JSON file".
  - Sources: the old `_posts/2000-01-02-why.md` (from git history), `Readme.md`@v1.1.16.
- **`start/installation.md`**
  - Sections: Gradle (Kotlin and Groovy tabs), Maven, the plain jar from Maven Central; Java 8+, one artifact; logging is SLF4J (add a binding); Android note linking to the Android guide.
  - Check the SLF4J dependency claim in `build.gradle`@v1.1.16.
- **`start/quick-start.mdx`**
  - Uses `<Steps>`: define `User` with `@Document(collection="users", schemaVersion="1.0")` and `@Id`; create a `JsonDBTemplate` with try-with-resources and `Arrays.asList(User.class)`; `createCollection` if `!collectionExists`; `insert`, `find`, `count`; show the resulting `users.json`.
  - The program runs end to end in the harness.

#### Task 7: Guides, part 1

- **`guides/documents.md`**
  - `@Document` (`collection`, `schemaVersion`), `@Id` (one per class; JsonDB's own annotation, and `javax.persistence.Id` is rejected with `InvalidJsonDbApiUsageException`), `@Secret` (needs a cipher; String fields).
  - Requirements for POJOs: check the Serializable and getter/setter claims against `ReflectionPropertyHandler.java`@v1.1.16 and write only what's true.
  - Sources: `annotation/*.java`.
- **`guides/jsondbtemplate.md`** *(New)*
  - Table of all seven constructors, from `JsonDBTemplate.java`@v1.1.16 lines 100–147.
  - Package scanning vs entity classes; one instance per folder, shared between threads; the warning text; `close()` and try-with-resources; `reLoadDB`/`reloadCollection`; `compatibilityMode` and `schemaComparator`.
- **`guides/android-osgi.md`** *(New)*
  - API 26+; why package scanning fails; pass entity classes; no `java.beans` or `SunJCE` needed; where to put the database folder (`context.getFilesDir()`).
  - Android snippets are illustrative and use only JsonDB API. The Android `Context` line is marked as Android-only, and its JsonDB calls are compiled in the harness with a plain path.
- **`guides/crud.md`**
  - `createCollection`/`collectionExists`/`dropCollection`; `insert` (fails on a duplicate id); `save` (fails if missing); `upsert`; `remove` (returns the removed document); batch variants; `findById`, `findOne`, `findAll`, `getCollection`; read-only collections; `InvalidJsonDbApiUsageException` for unknown collections.
  - Check every "fails if…" claim in the harness.

#### Task 8: Guides, part 2

- **`guides/queries.md`** (`count()` is *New*)
  - JXPath basics (`/.[field='x']`); and/or/not; comparisons; `contains()`, `starts-with()`; nested properties; `find` by class vs by collection name; `findOne`; `count(Class)`/`count(String)`.
  - A security callout: extension functions are disabled, core functions work; the example of `/.[java.lang.System.exit(0)]` now being rejected.
  - Check in the harness: `contains()`, `not()` and `count()` work, and an extension-function query throws. Record the exact exception type.
- **`guides/sorting-slicing.md`**
  - `Comparator` (show both a lambda and `Comparator.comparing`, since both are Java 8); slice syntax `i:j:k`, with a table of examples taken from the slicing code at v1.1.16; `findAll(Class, null, "0:7:2")`.
- **`guides/find-and-modify.md`**
  - `Update.update(field, value).set(...)`; `findAndModify`/`findAllAndModify`; `findAndRemove`/`findAllAndRemove`; the conversion rules from `query/Update.java` and `ReflectionPropertyHandler.java`@v1.1.16; changing `@Id` is rejected (#78), but setting it to its current value is allowed.

#### Task 9: Guides, part 3, and Reference

- **`guides/encryption.md`**
  - `Default1Cipher` (AES-GCM; key format from `crypto/Default1Cipher.java`); `CryptoUtil.generate128BitKey(password, salt)`; `DefaultAESCBCCipher`, deprecated, and why; custom `ICipher`; `changeEncryption(newCipher)`, with a note to back up first; on disk only `@Secret` fields are encrypted.
  - The harness shows a raw file containing ciphertext, and a round trip.
- **`guides/schema-versions.md`**
  - `schemaVersion` on `@Document`; `CollectionSchemaUpdate.update(...)` with `RenameOperation`, `AddOperation`, `DeleteOperation` (constructors from `query/ddl/*`@v1.1.16); add fills only missing or null values; updates that would lose data are rejected (record the exception); `DefaultSchemaVersionComparator` and custom comparators.
- **`guides/backup-restore.md`**
  - Port the existing section, adapted to Starlight with `<Aside>` and `<Tabs>`. Keep every claim, each one checked in the harness: `.zip` is appended; the directory form writes `jsondb-backup.zip`; `lock/` is excluded; replace vs merge.
- **`guides/file-change-listeners.md`**
  - `CollectionFileChangeListener`/`CollectionFileChangeAdapter` methods; add, remove and `hasCollectionFileChangeListener`; when events fire (external edits); pairing with `reloadCollection`; `close()` stops the watcher.
  - The harness checks add, remove and has. Event delivery is async and OS-dependent, so it's described, not asserted.
- **`reference/xpath-cheatsheet.md`**
  - A table of query → meaning. Every row is executed in the harness against a fixture collection.
- **`reference/upgrading.md`**
  - From 1.0.x: Maven coordinates (the old `-j8`/`-j11` → `jsondb-core` 1.1.16); Java 8 baseline; extension functions disabled; commons-beanutils removed; `close()`; entity-class constructors; behaviour changes in the 1.1.0 and 1.1.16 bug-fix lists that users might notice.
  - Check the old artifact ids against the git history of `Readme.md`/`build.gradle`.
- **`reference/security.md`**
  - Extension functions disabled (#67); dependency upgrades (#86); encryption-at-rest scope (only `@Secret` fields, not ids or other fields); the key-management advice; how to report a vulnerability (GitHub issues, or a security advisory if enabled — check `gh api repos/Jsondb/jsondb-core/private-vulnerability-reporting`).

### Task 10: CI, Dependabot and README for the site

**Files:**
- Create: `.github/workflows/deploy.yml`, `.github/dependabot.yml`
- Modify: `README.md`

- [ ] **Step 1: Write `deploy.yml`.**

```yaml
name: Build and deploy

on:
  pull_request:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist

  deploy:
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/master'
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

  Before committing, check the latest major of each action with `gh api repos/actions/<name>/releases/latest --jq .tag_name` and use those.
- [ ] **Step 2: Write the site's `dependabot.yml`.** npm, weekly, grouped as `groups: { npm: { patterns: ["*"] } }`; github-actions, weekly, grouped likewise.
- [ ] **Step 3: Rewrite `README.md`.** What the site is; `nvm use`, `npm ci`, `npm run dev`; `npm run icons` after editing the logo SVGs; deploys happen on merge to master through Actions; content lives in `src/content/docs/`.
- [ ] **Step 4: Validate the YAML** (Ruby, as in Task 1), then run `npm ci` and `npm run build` from clean.
- [ ] **Step 5: Commit.** Message: `Build and deploy the site with GitHub Actions; add Dependabot.`

### Task 11: Verify, push, open the PR

- [ ] **Step 1: Run the full check.**
  - Run: `rm -rf dist node_modules .astro`, then `npm ci`, `npm run build`, and the harness `verify`.
  - Expected: all pass, and the validator reports 0 errors.
- [ ] **Step 2: Check external links.**
  - Run `curl -sI -o /dev/null -w '%{http_code} %{url}\n'` on every external URL in `src/` (find them with `grep -rhoE 'https://[^ )"]+' src | sort -u`).
  - Expected: every one returns 200 or 301/302 to a 200.
- [ ] **Step 3: Check the head tags.** Grep `dist/index.html` for `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` and `og.png`.
- [ ] **Step 4: Push the branch and open the PR on `Jsondb/jsondb.github.io`.** The body includes:
  - **Where to look:**
    - review closely: `astro.config.mjs` (sidebar, head, edit link), `.github/workflows/deploy.yml` (permissions, deploy condition), `src/content/docs/guides/*` (technical accuracy);
    - skim: `theme.css`, the components, `build-icons.mjs`, the start and reference pages;
    - safe to skip: the generated `public/*.png|ico`, `package-lock.json`, the `docs/superpowers/*` spec and plan, the deleted Jekyll files.
  - **Does not:** switch the Pages source (needed before merge; asked separately), touch `LICENSE.txt` (a question for Farooq), or document unreleased changes.
  - **How it was checked:** the snippet harness against 1.1.16, the link validator, and the external link check.
  - "Part of #80."
- [ ] **Step 5: Wait for the `build` check to pass on the PR.** Don't merge.
- [ ] **Step 6: Hand the visual check to Farooq.**
  - Run `npm run preview`, give him the local URL, and ask him to check the landing page, one guide, search, light/dark mode, phone width, and the tab favicon. Or ask him to reconnect the Chrome extension so I can take screenshots.
  - Don't claim the visual check is done myself.

### Task 12: Settings and closing #80 (each step confirmed in chat first)

- [ ] **Step 1: Before the merge, switch Pages to GitHub Actions.** `gh api -X PUT repos/Jsondb/jsondb.github.io/pages -f build_type=workflow`
- [ ] **Step 2: Farooq merges.** Then watch the deploy run, and `curl` https://jsondb.github.io/ for the new title and the `og.png`.
- [ ] **Step 3: Apply branch protection on `master`** to match `jsondb-core`: required check `build`, 1 approval, a FarooqKhan-only bypass, `enforce_admins: true`. Use `gh api -X PUT repos/Jsondb/jsondb.github.io/branches/master/protection --input <json>`, then read it back to compare.
- [ ] **Step 4: Turn on Dependabot security alerts for both repos** if they're off: `gh api -X PUT repos/Jsondb/<repo>/vulnerability-alerts`, plus `automated-security-fixes` if Farooq wants it.
- [ ] **Step 5: Close #80** with a comment linking both PRs and the settings that were applied.
