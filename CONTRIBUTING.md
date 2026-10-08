# Contributing

Everything you see on the site comes from JSON files in [`content/`](content). To add a
technology, fix a fact or improve an explanation, edit those files. You don't need to touch
any code.

```
content/
  parts.json               the five parts of the handbook (Build, Infrastructure, Data, Ship & run, Teams)
  categories.json          the topics in each part (Programming, Compute, Databases, ...): /topics/<id>/
  concepts/<id>.json       vendor-neutral ideas: /concepts/<id>/
  technologies/<id>.json   specific products: /technologies/<id>/
  architectures/<id>.json  real stacks built from technologies: /architectures/<id>/
  comparisons/<id>.json    side-by-side tables of concepts or technologies: /compare/<id>/
  foundations/<id>.json    open-source foundations such as Apache: /foundations/<id>/
  resources/<id>.json      articles, videos and websites worth exploring: /resources/
  benchmarks/<id>.json     public benchmarks and how to read them: /benchmarks/<id>/
  system-map.json          the big diagram on the home page
```

The three levels link to each other automatically. A technology names its concepts, so it
appears on their pages. An architecture's diagram names technologies, so it appears on their
pages as "See it in a real stack". You never list those links by hand.

## Setup

You need [Bun](https://bun.sh).

```bash
bun install
bun run dev        # http://localhost:4321, reloads as you edit
bun run validate   # checks every content file in about a second
bun run links      # checks that every source link still loads (add file paths to check just those)
```

Open the repo in VS Code (or any editor that understands JSON Schema) after running
`bun run dev` once. The `"$schema"` line at the top of each file then gives you autocomplete
and inline errors for every field.

## Add a technology

This is the most common contribution. Copy `content/technologies/ducklake.json` to
`content/technologies/<your-id>.json` and fill in:

| Field | What goes there |
|-------|-----------------|
| `name` | The official product name, e.g. `"Apache Kafka"`. |
| `concepts` | Concept ids it's an example of. The first decides where it's listed, e.g. `["stream"]`. |
| `kinds` | Needed when one of its concepts is split into kinds: one kind id per such concept, e.g. `["columnar-files"]` for a file format. The validator lists the choices. |
| `parent` | Optional. Lists it under another technology with the same first concept instead of beside it: `{ "id": "kubernetes", "as": "managed" }`. `as` is `managed` (a cloud service that runs it), `distribution`, `fork`, `local` (runs it on a laptop or in CI), `tool` (installs or manages it) or `extension` (built on it). The parent's page then shows a family section. See `eks.json`. |
| `provider` | `aws`, `gcp` or `azure` for that cloud's own service; `oss` for open source; `vendor` for a commercial product from another company. |
| `vendor`, `license`, `website` | Who makes it, under what licence, and its homepage. |
| `repo` | The official source repository, if the code is public, e.g. `"https://github.com/apache/kafka"`. Leave it out for closed services. |
| `archived` | Only when the project is no longer maintained or can’t be installed the usual way: `since` (`YYYY-MM-DD`), a `reason`, and `alternatives`, ids of maintained technologies, best fit first. The page shows a banner and the sidebar tags it. See `minio.json`. |
| `summary` | One plain sentence. |
| `intro` | One to three short paragraphs on how it works and what makes it different. |
| `strengths`, `limits` | Two to four honest bullets each. |
| `worksWith` | How it composes with other technologies: `{ "id": "postgresql", "how": "keeps its catalog in" }` reads as "DuckLake keeps its catalog in PostgreSQL". List each pair once, on the side that uses the other. The other page shows it too. |
| `snippet` | Optional code: `lang`, a `title` and `source` lines. |
| `sections` | Optional deep-dive sections (`text`, `table`, `cards`, `model`, `code`), as on `s3.json`. |
| `history` | Where it came from. See [History](#history) below. |
| `play` | Optional. How it behaves in the playground, if its concept's default in `src/content/play.ts` doesn't fit. |
| `sources` | Direct sources for the facts on the page. Required. See [Sources](#sources). |
| `checked` | The date you last checked the facts, `YYYY-MM-DD`. |

Vendor details go stale, so every fact should be traceable to a source. When you update
facts, update `checked` too.

## Add an architecture

An architecture is a real stack with a live model. The quickest way to make one is in the
playground: start from a similar architecture or a blank canvas, build the design, then press
**JSON** to copy it as a `diagram`. Create `content/architectures/<id>.json` with a `title`,
`order`, `summary`, `intro`, `fits` (who it suits), that `diagram`, and:

- `steps`: how data or requests move through it, in order. Each has a `title`, `text` and the
  diagram `nodes` it's about.
- `good` and `watch`: why the shape works, and where it strains.
- `swaps`: common variations, each with the `techs` it mentions.

Give each diagram node a `tech` (a technology id) so it links to that page, or a `concept` for
a generic box such as "Load balancer". Write a `caption` that says what the viewer is watching.

## Add a concept

Concepts are the vendor-neutral ideas, so new ones are rarer.

1. Copy a similar concept, such as `content/concepts/queue.json`, to `content/concepts/<your-id>.json`.
   Use lowercase letters, digits and dashes for the id, e.g. `service-mesh`.
2. Fill in the fields:

   | Field | What goes there |
   |-------|-----------------|
   | `name` | Display name, e.g. `"Service mesh"`. |
   | `category` | An id from `categories.json`: `code`, `design`, `compute`, `network`, `messaging`, `storage`, `data`, `modeling`, `analytics`, `delivery`, `observe`, `security` or `org`. Each category belongs to a part (its `part` field) and gets a topic page at `/topics/<id>/` listing its concepts, technologies, comparisons and stacks. |
   | `order` | Position within the category. Codes like `NET-03` follow this order. Existing concepts use 10, 20, 30..., so you can slot in between with 25. |
   | `summary` | One plain sentence. Shown in lists and under the title. |
   | `howItWorks` | A short paragraph on the mechanism. |
   | `analogy` | An everyday comparison. |
   | `useWhen`, `avoidWhen` | Two to four short bullets each. |
   | `example` | A concrete scenario with real numbers where you can. |
   | `providers` | What `aws`, `gcp`, `azure` and `oss` (open source and others) call it. Search matches these, so list the product names people actually type. Leave it out for ideas no provider sells, such as a coding style or a team practice; the concept then stays out of the playground. |
   | `snippet` | Optional. `lang` (`bash`, `c`, `cpp`, `dockerfile`, `go`, `haskell`, `hcl`, `http`, `java`, `js`, `json`, `nginx`, `python`, `rust`, `sql`, `text`, `ts` or `yaml`) and `source`, one string per line. |
   | `related` | Ids of concepts people confuse with this one. |
   | `diagram` | The live model. See below. Optional: leave it out when moving packets can’t show the idea. |
   | `sections` | Optional deep-dive sections (`text`, `table`, `cards`, `model`, `code`), as on technologies, shown after the example. |
   | `kinds` | Optional. Sub-types, each with its own page at `/concepts/<concept>/<kind>/`: an `id` (unique across concepts), `name`, `summary`, one to three `body` paragraphs and `sources`. Every technology that lists the concept then names one of them. See `file-formats.json`. |
   | `history` | Where the idea came from. See [History](#history) below. |
   | `sources` | Direct sources for the facts on the page, such as each provider’s docs page and the relevant RFC or paper. See [Sources](#sources). |

   Wrap code-like words in backticks (`` `terraform plan` ``) and they render as inline code.
3. Run `bun run validate`, then check the page in `bun run dev`.
4. Open a pull request. CI runs the same checks and builds the site.

## The live model

Each concept and architecture has a small animated diagram. It's a list of nodes on a canvas that is 760 × 260
units by default (set `w` and `h` to change it). `x` and `y` are the **centre** of each node.
Packets start at nodes that have `emit`, follow `out` links and do something when they arrive,
depending on the node's `kind` and `mode`.

```json
"diagram": {
  "caption": "Requests arrive at the load balancer, which spreads them over three healthy servers.",
  "h": 260,
  "nodes": [
    { "id": "users", "x": 110, "y": 130, "label": "Users", "sub": "browsers",
      "emit": { "every": 400, "jitter": 0.4, "req": true }, "out": ["lb"] },
    { "id": "lb", "x": 330, "y": 130, "label": "Load balancer", "out": ["a", "b", "c"] },
    { "id": "a", "x": 580, "y": 60,  "label": "Server A", "mode": "reply", "delay": 150 },
    { "id": "b", "x": 580, "y": 130, "label": "Server B", "mode": "reply", "delay": 150 },
    { "id": "c", "x": 580, "y": 200, "label": "Server C", "mode": "reply", "delay": 150 }
  ]
}
```

**Kinds** (`kind`)

| Kind | Draws | Needs |
|------|-------|-------|
| `svc` (default) | A labelled box. | |
| `pool` | A box with instance slots that scale up under load and back down when idle. | `max`; optionally `min`, `work`, `idle`, `cold`. |
| `queue` | A bounded buffer that only releases to a consumer with free capacity. | `cap`; optionally `gap`. |
| `log` | An append-only stream where each reader keeps its own offset. | `cells`, `readers`; optionally `retain`. |

**Modes** (`mode`): what a node does with a packet that arrives.

| Mode | Behaviour |
|------|-----------|
| `fwd` (default) | Pass it on along `out`. |
| `sink` | Absorb it. |
| `reply` | Answer requests (`req: true`) after `delay` ms. The reply travels back along the path it came. |
| `cache` | With probability `p` answer immediately ("HIT"), otherwise forward ("MISS"). |
| `gate` | Allow with probability `p`, or only `allowTypes`; otherwise drop it, or send it to `deny`. |

**Routing** (`route`): how a node picks among its `out` targets. `rr` (default) is round robin
over healthy targets, `fanout` sends to all of them, `hash` picks by packet key, and `type` uses
the `rules` map from packet type to targets.

**Emitters** (`emit`) set the traffic: `every` (ms between packets), `jitter` (0 to 1),
`phases` for bursty patterns (`[[durationMs, everyMs], ...]`, where `null` means silence),
`req: true` for requests that expect a reply, and `color` (0 to 3) or `colorByKey`,
`colorByType`, `cycle` for colouring.

**Outages** (`events`) take a node down on a schedule, to show failover:
`{ "node": "b", "at": 3000, "every": 9000, "dur": 3000, "text": "down", "back": "healthy" }`.

**Links**: set `tech` to a technology id, or `concept` to a concept id, and that node becomes
a link to its page.

Every field has a description in the schema, so your editor shows it on hover. The full
definitions are in [`src/content/schema.ts`](src/content/schema.ts). The quickest way to learn
is to open a model that resembles what you want and change it, or build it in the playground
and copy the JSON.

## History

Every technology and concept has a `history`: why it was created, what problem it was solving and
why it’s built the way it is. `content/technologies/kafka.json` is a good example.

```json
"history": {
  "story": ["Two or three paragraphs: the world before it, who built it and why, what it changed."],
  "choices": [
    { "choice": "An append-only log instead of a queue", "why": "The constraint or lesson behind the decision." }
  ],
  "timeline": [{ "year": "2011", "text": "Open-sourced by LinkedIn" }],
  "sources": [{ "label": "The original paper", "url": "https://..." }]
}
```

- `choices` is the most useful part: two to four early design decisions and the reasons for them.
- `timeline` has four to seven dates, oldest first.
- `sources` should be primary where possible: papers, launch announcements, the creators’ own posts.
  Never quote anything you haven’t read in a source.
- For a concept, tell the story of the idea rather than of one product.

## Sources

Every fact on a page, history included, should be backed by a source listed on that page:
`sources` for the page, `history.sources` for the history. Concepts and comparisons have a
`sources` list too; architectures have an optional one for facts the technology pages don’t cover.

- **Direct means primary and specific.** Link the docs page that states the limit, the release notes
  or announcement that introduced the feature, the paper, the spec, the commit. A homepage or a
  docs landing page isn’t a source. Wikipedia and news articles are fine as a supplement, or
  when nothing primary exists.
- **Label it** with who and what, plus a date for announcements:
  `"AWS What’s New: Lambda supports 10 GB of memory (Dec 2020)"`.
- **When a page disappears**, or no longer says what you cite, keep its `url` and add an `archive`
  copy from the Wayback Machine. The page then links to the copy:

  ```json
  { "label": "MinIO blog: MinIO is now fully licensed under GNU AGPLv3 (May 2021)",
    "url": "https://blog.min.io/from-open-source-to-free-and-open-source-minio-is-now-fully-licensed-under-gnu-agplv3/",
    "archive": "https://web.archive.org/web/20210512162446/https://blog.min.io/from-open-source-to-free-and-open-source-minio-is-now-fully-licensed-under-gnu-agplv3/" }
  ```

  Find a snapshot with `https://archive.org/wayback/available?url=<url>&timestamp=<YYYYMMDD>`,
  or save one at `https://web.archive.org/save/<url>`.
- `bun run links` fails on dead links that have no `archive` copy. Sites that block scripts are
  listed separately: check those in a browser.

## Add a comparison

Create `content/comparisons/<id>.json` with a `title`, `order`, two to four `concepts`, `rows`
(each a `label` plus one value per concept, in the same order), a `tip` and `sources`. The concept pages
link to the comparisons they appear in automatically.

To compare products rather than ideas, such as Kata Containers, gVisor and Firecracker, list two to
four `technologies` instead of `concepts`. Their pages link to the comparison the same way.

## Add a foundation

Create `content/foundations/<id>.json` with a `name`, `vendor`, `website`, `summary`, `intro`,
optional `sections`, a `history`, `sources` and `checked`. `vendor` must match the `vendor` of its
projects exactly, e.g. `"Apache Software Foundation"`: the page lists those technologies, and their
pages link back, automatically.

## Add a resource

A resource is a link worth exploring: an article, video, slides, paper, book, podcast, course or
website. Create `content/resources/<id>.json` with its `title` (as the page itself gives it),
`url`, `kind`, `by` (author and publisher), `published` (`YYYY`, `YYYY-MM` or `YYYY-MM-DD`; leave
it out for a website that keeps changing), a one- or two-sentence `summary` and `added`.

The summary says what a reader will learn, and any bias: if a vendor wrote it about its own
product, say so. List the `concepts`, `technologies` and `architectures` it covers; it then
appears under “Worth exploring” on those pages. A resource that names none is listed under
“The big picture” on /resources/.

## Add a benchmark

A benchmark gets its own page because its numbers need context. Create
`content/benchmarks/<id>.json` with its `name`, `by` (who maintains it), `website` (where the results
are), `repo` and `license` if public, a one-line `summary`, an `intro` on what it runs and how a
result is produced, `setup` (short label and value pairs: dataset, queries, metric, hardware, who
submits results), `caveats`, optional `sections`, `sources` and `checked`.

`caveats` is the point of the page: who runs it (a vendor in its own results?), how far its
workload is from a typical one, tuning rules, stale versions. List the `concepts` whose products it
compares and the `technologies` in its results that have pages; it then appears under
“Benchmarks” on those pages.

## Style

- Plain language first. Explain the mechanism before the jargon.
- Short sentences, and concrete numbers over adjectives.
- Name real products, but keep the text vendor-neutral.
- Use curly quotes and apostrophes (’ “ ”) to match the existing text.
