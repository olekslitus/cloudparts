// How each concept behaves in the playground, unless a technology overrides it with "play".
// Storage and databases use "reply": they answer requests and absorb plain data.
import type { Play } from './schema';

export const CONCEPT_PLAY: Record<string, Play> = {
  // compute
  vm: { kind: 'pool', min: 2, max: 2, work: 300 },
  containers: { kind: 'pool', min: 1, max: 4, work: 300, cold: 1000, idle: 4000 },
  microvm: { kind: 'pool', max: 6, work: 400, cold: 125, idle: 1500, coldText: 'boot 125 ms' },
  orchestration: { kind: 'pool', min: 2, max: 6, work: 300, cold: 800, idle: 5000 },
  serverless: { kind: 'pool', max: 8, work: 400, cold: 450, idle: 2000 },
  autoscaling: { kind: 'pool', min: 1, max: 6, work: 300, cold: 1500, idle: 4000 },
  actors: { kind: 'pool', min: 1, max: 1, work: 300 },
  // messaging
  queue: { kind: 'queue', cap: 6, gap: 200 },
  stream: { kind: 'log', cells: 10, retain: 40 },
  pubsub: { route: 'fanout' },
  eventbus: { route: 'fanout' },
  workflow: { kind: 'pool', min: 1, max: 3, work: 900 },
  'stream-processing': { kind: 'pool', min: 1, max: 4, work: 300, idle: 5000 },
  iot: { route: 'fanout' },
  // storage
  object: { mode: 'reply', delay: 80 },
  block: { mode: 'reply', delay: 5 },
  file: { mode: 'reply', delay: 20 },
  backup: { mode: 'sink' },
  // databases
  relational: { mode: 'reply', delay: 60 },
  'key-value': { mode: 'reply', delay: 10 },
  document: { mode: 'reply', delay: 20 },
  'wide-column': { mode: 'reply', delay: 20 },
  graph: { mode: 'reply', delay: 30 },
  cache: { mode: 'cache', p: 0.8 },
  tsdb: { mode: 'reply', delay: 50 },
  search: { mode: 'reply', delay: 30 },
  coordination: { mode: 'reply', delay: 20 },
  // analytics
  'file-formats': { mode: 'reply', delay: 60 },
  'table-formats': { mode: 'reply', delay: 40 },
  'query-engines': { kind: 'pool', min: 1, max: 4, work: 700 },
  warehouse: { kind: 'pool', min: 1, max: 4, work: 500 },
  olap: { mode: 'reply', delay: 30 },
  'data-lake': { mode: 'reply', delay: 80 },
  lakehouse: { mode: 'reply', delay: 100 },
  etl: { kind: 'pool', min: 1, max: 3, work: 800 },
  // network
  lb: {},
  cdn: { mode: 'cache', p: 0.85 },
  apigw: { mode: 'gate', p: 0.95, denyText: '429 throttled' },
  dns: {},
  vpc: {},
  'service-mesh': { mode: 'gate', p: 0.98, denyText: 'mTLS denied' },
  rpc: { mode: 'reply', delay: 30 },
  'web-api': { mode: 'reply', delay: 60 },
  // delivery, observability, security
  iac: { mode: 'sink' },
  observability: { mode: 'sink' },
  cicd: { mode: 'sink' },
  secrets: { mode: 'reply', delay: 10 },
  iam: { mode: 'gate', p: 0.97, denyText: 'denied' },
  'remote-access': { mode: 'gate', p: 0.95, denyText: 'no session' },
  emulators: { mode: 'reply', delay: 10 },
};
