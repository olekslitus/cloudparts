// A highlighted code block, in GitHub's light and dark themes (global.css switches them with the site theme).
import { codeToHtml } from 'shiki';

export default async function Code({ code, lang }: { code: string; lang: string }) {
  const html = await codeToHtml(code, { lang, themes: { light: 'github-light', dark: 'github-dark' } });
  return <div className="contents" dangerouslySetInnerHTML={{ __html: html }} />;
}
