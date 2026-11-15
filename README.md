# jsondb.github.io

The source of the JsonDB website and documentation at https://jsondb.github.io. JsonDB itself lives in [Jsondb/jsondb-core](https://github.com/Jsondb/jsondb-core).

The site is built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

## Working on it locally

You need Node.js. The version is in `.nvmrc`; with nvm, run `nvm use`.

```sh
npm ci           # install the exact dependency versions
npm run dev      # live preview at http://localhost:4321
npm run build    # production build into dist/, including the link check
npm run preview  # serve the production build
```

## Where things are

| Path | What |
|---|---|
| `src/content/docs/` | The pages, in Markdown and MDX. The sidebar is in `astro.config.mjs`. |
| `src/styles/theme.css` | Colours (the indigo theme) and the landing-page styles. |
| `src/components/` | The header title and the landing page's code demo. |
| `src/assets/logo*.svg` | The logo: large, small (favicons and header), and monochrome. |
| `public/` | Favicons and the social card, generated from the logo. |

After changing a logo SVG, run `npm run icons` to regenerate the files in `public/`, and commit them.

## Deploying

Every pull request runs the `build` workflow, which is the required check. Merging to `master` builds the site again and deploys it to GitHub Pages through the same workflow. There's no other deploy step.

The documented API is the latest **released** version of jsondb-core. Update the docs when a release ships, not before.
