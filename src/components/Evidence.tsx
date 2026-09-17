import { sources, type SourceId } from '../content/sources'

/** The locator is visible on keyboard focus as well as hover. */
export function Citation({ id, locator, number, namespace = '' }: { id: SourceId; locator?: string; number?: number; namespace?: string }) {
  const index = sources.findIndex((source) => source.id === id)
  const source = sources[index]
  return <span className="citation"><a href={source.url} target="_blank" rel="noreferrer" aria-label={`Reference ${namespace}${number ?? index + 1}: ${source.title}, ${locator ?? source.locator}`}>[{namespace}{number ?? index + 1}]</a><span role="tooltip">{source.authors}, {source.year}. {source.title}. {locator ?? source.locator}.</span></span>
}

export function References() {
  return <section className="references" id="references" aria-labelledby="references-title"><h2 id="references-title">Primary references</h2><ol>{sources.map((source) => <li id={`ref-${source.id}`} key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><span>{source.authors}, {source.year}. {source.locator}.</span></li>)}</ol></section>
}

export const SITE_URL = 'https://bdh-state-microscope.vercel.app'

export function BrandMark() { return <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span> }

export function SiteHeader({ links, note }: { links: [string, string][]; note: string }) {
  return <header className="site-header"><a className="brand" href="/" aria-label="BDH State Microscope home"><BrandMark />State microscope</a><nav aria-label="Page sections">{links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav><span className="header-note">{note}</span></header>
}

export function ArtifactFooter() {
  const repo = 'https://github.com/drcocktail/bdh-state-microscope'
  return <footer className="artifact-footer">
    <div className="footer-intro"><a className="footer-brand" href="/"><BrandMark />State microscope</a><p className="footer-statement">Follow a write. Read the state. Find out why an answer changes.</p></div>
    <nav aria-label="Artifact resources">
      <div><h2>Explore</h2><a href="/#microscope">Attention microscope</a><a href="/blog/">Reasoning without a transcript</a><a href="/lab/">State mechanics lab</a></div>
      <div><h2>Read</h2><a href="/blog/reasoning-without-a-transcript-v2.pdf">Essay PDF</a><a href="/dataforge-latent-reasoning-blog.pdf">Submitted blog v1 PDF</a><a href={`${repo}/blob/final-push/README.md`}>Project guide</a><a href={`${repo}/blob/final-push/CHANGELOG.md`}>Changelog</a></div>
      <div><h2>Source</h2><a href={repo}>Repository</a><a href={`${repo}/blob/final-push/LICENSE`}>MIT license</a><a href={`${repo}/blob/final-push/docs/SOURCE_AND_LICENSE_RECORD.md`}>Source and license record</a><a href={`${repo}/blob/final-push/docs/AI_DISCLOSURE.md`}>AI disclosure</a></div>
    </nav>
    <div className="footer-bottom"><a className="footer-domain" href={`${SITE_URL}/`}>bdh-state-microscope.vercel.app</a><p>Independent educational work. No Pathway affiliation or endorsement. Built with AI assistance; every experiment runs in your browser.</p><a className="footer-return" href="#">Back to top ↑</a></div>
  </footer>
}
