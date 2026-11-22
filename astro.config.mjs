/*
 * Copyright (c) 2026 Farooq Khan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

const site = 'https://jsondb.github.io';

export default defineConfig({
  site,
  integrations: [
    starlight({
      title: 'JsonDB',
      description:
        'An embedded Java database that stores its data as plain JSON files, with XPath queries and optional encryption.',
      logo: { src: './src/assets/logo-small.svg', alt: '' },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Jsondb/jsondb-core' }],
      editLink: { baseUrl: 'https://github.com/Jsondb/jsondb.github.io/edit/master/' },
      customCss: ['@fontsource-variable/inter', '@fontsource-variable/jetbrains-mono', './src/styles/theme.css'],
      components: { SiteTitle: './src/components/SiteTitle.astro' },
      plugins: [starlightLinksValidator()],
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
        { tag: 'meta', attrs: { property: 'og:image', content: `${site}/og.png` } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
      sidebar: [
        { label: 'Start here', items: ['start/introduction', 'start/installation', 'start/quick-start'] },
        {
          label: 'Guides',
          items: [
            'guides/documents',
            'guides/jsondbtemplate',
            'guides/android-osgi',
            'guides/crud',
            'guides/queries',
            'guides/sorting-slicing',
            'guides/find-and-modify',
            'guides/encryption',
            'guides/schema-versions',
            'guides/backup-restore',
            'guides/file-change-listeners',
          ],
        },
        {
          label: 'Reference',
          items: [
            'reference/xpath-cheatsheet',
            'reference/upgrading',
            'reference/security',
            { label: 'Javadoc', link: 'https://javadoc.io/doc/io.jsondb/jsondb-core/1.1.93/', attrs: { target: '_blank' } },
            { label: 'Changelog', link: 'https://github.com/Jsondb/jsondb-core/blob/master/CHANGELOG.md', attrs: { target: '_blank' } },
            { label: 'Releases', link: 'https://github.com/Jsondb/jsondb-core/releases', attrs: { target: '_blank' } },
          ],
        },
      ],
    }),
  ],
});
