// Companies whose products the landscape can pick out. A technology belongs to the first one whose
// pattern matches its `vendor`, whatever its provider: AWS's list includes Firecracker, and Google's
// includes Go as well as BigQuery.
export interface Maker {
  id: string;
  name: string;
  /** Sells infrastructure to run on: listed first. */
  cloud?: boolean;
  vendor: RegExp;
}

export const MAKERS: Maker[] = [
  { id: 'aws', name: 'AWS', cloud: true, vendor: /^Amazon Web Services\b/ },
  { id: 'google', name: 'Google', cloud: true, vendor: /^Google\b/ },
  { id: 'microsoft', name: 'Microsoft', cloud: true, vendor: /^Microsoft\b|^GitHub \(Microsoft\)/ },
  { id: 'cloudflare', name: 'Cloudflare', cloud: true, vendor: /^Cloudflare\b/ },
  { id: 'oracle', name: 'Oracle', cloud: true, vendor: /^Oracle\b/ },
  { id: 'alibaba', name: 'Alibaba Cloud', cloud: true, vendor: /^Alibaba Cloud\b/ },
  { id: 'oxide', name: 'Oxide', cloud: true, vendor: /^Oxide Computer\b/ },
  { id: 'wasabi', name: 'Wasabi', cloud: true, vendor: /^Wasabi\b/ },
  { id: 'backblaze', name: 'Backblaze', cloud: true, vendor: /^Backblaze\b/ },
  { id: 'tigris', name: 'Tigris', cloud: true, vendor: /^Tigris\b/ },
  { id: 'fly', name: 'Fly.io', cloud: true, vendor: /^Fly\.io\b/ },
  { id: 'vercel', name: 'Vercel', cloud: true, vendor: /^Vercel\b/ },
  { id: 'netlify', name: 'Netlify', cloud: true, vendor: /^Netlify\b/ },
  { id: 'render', name: 'Render', cloud: true, vendor: /^Render\b/ },
  { id: 'koyeb', name: 'Koyeb', cloud: true, vendor: /^Koyeb\b/ },
  { id: 'supabase', name: 'Supabase', cloud: true, vendor: /^Supabase\b/ },
  { id: 'ibm', name: 'IBM, with HashiCorp and Confluent', vendor: /\ban IBM company\b|^IBM\b/ },
  { id: 'meta', name: 'Meta', vendor: /^Meta\b/ },
  { id: 'databricks', name: 'Databricks', vendor: /^Databricks\b/ },
  { id: 'clickhouse', name: 'ClickHouse', vendor: /^ClickHouse\b/ },
  { id: 'anthropic', name: 'Anthropic', vendor: /^Anthropic\b/ },
  { id: 'openai', name: 'OpenAI', vendor: /^OpenAI\b/ },
  { id: 'broadcom', name: 'Broadcom, with VMware', vendor: /^Broadcom\b/ },
  { id: 'redhat', name: 'Red Hat', vendor: /^Red Hat\b/ },
];

export const makerOf = (t: { vendor?: string }) => MAKERS.find(m => m.vendor.test(t.vendor ?? ''));
