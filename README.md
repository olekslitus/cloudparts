# Cloud Parts

*Handbook for Modern Software Engineering.* An interactive guide to how software is written,
shipped and kept running, at three levels:

- **Concepts**: the vendor-neutral ideas, from code (dynamic dispatch, the event loop) and data
  modeling to cloud parts (a queue, a CDN, a table format), delivery, observability and how teams
  work. Each says when to use it and when not to, and many have a live animated model and what each
  provider calls it.
- **Technologies**: specific products such as Kafka, PostgreSQL or DuckLake, one level deeper in
  the handbook under the concept (and kind) they implement. Each page shows what the product plugs
  into, its trade-offs, alternatives and sources for every fact.
- **Architectures**: real stacks composed from those technologies, running live, explained
  step by step.

A **playground** lets you drag technologies onto a canvas, connect them and run traffic
through your own design. There are also side-by-side comparisons of concepts that are easy
to mix up.

The content lives in JSON files under [`content/`](content), so adding a technology is a pull
request with one new file. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Develop

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev        # http://localhost:4321
bun run validate   # check content files
bun run check      # validate + type-check
bun run build      # static site in dist/
bun run preview    # serve dist/
```

## Stack

- [Astro](https://astro.build) builds every page to static HTML. Content is loaded through
  content collections and validated with Zod at build time.
- React islands for the interactive pieces: the live model, the playground, search (⌘K or `/`),
  the theme toggle and the mobile menu.
- [shadcn/ui](https://ui.shadcn.com) components on Tailwind CSS v4, with the Geist typeface.
- Shiki for code highlighting, at build time.

## Layout

| Path | What it is |
|------|------------|
| `content/` | Categories, concepts, technologies, architectures, comparisons, foundations, resources, benchmarks and the home-page system map, as JSON. |
| `src/content/schema.ts` | Zod schemas for all content. Also generates the JSON Schemas editors use. |
| `src/content/integrity.ts` | Cross-file checks: unknown ids, broken links between concepts, technologies and architectures. |
| `src/content/play.ts` | How each concept behaves in the playground by default. |
| `src/lib/catalog.ts` | Loads, checks and orders the catalog, derives codes like `MSG-02`, and works out which technologies and architectures link to what. |
| `src/lib/sim/engine.ts` | The SVG simulation engine behind every live model and the playground. |
| `src/lib/playground/model.ts` | The playground’s design format, design checks and share links. |
| `src/components/` | `LiveModel`, `Playground`, `TechGraph`, `Search`, `MobileNav` and shadcn components in `ui/`. |
| `src/pages/` | `/`, `/concepts/`, `/technologies/`, `/architectures/`, `/compare/` (each with `[id]` pages) and `/playground/`. |
| `scripts/validate.ts` | `bun run validate`. |

Links from the earlier single-file version (`#queue`, `#vs-messaging`) redirect to the new URLs.

## Deploy

Pushing to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which
checks and builds the site and publishes it to GitHub Pages. To turn it on once:
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

The workflow sets the base path automatically, so the same build works at
`https://<user>.github.io/<repo>/` or on a custom domain. Pull requests run
[`ci.yml`](.github/workflows/ci.yml), which validates, type-checks and builds.
