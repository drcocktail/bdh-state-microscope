import { sources, type SourceId } from '../content/sources'

export type EvidenceType = 'Live computation' | 'Formal identity' | 'Precomputed replay' | 'Paper-reported' | 'Teaching simplification' | 'Hypothesis'

export function EvidenceBadge({ type }: { type: EvidenceType }) {
  return <span className="evidence-tag">{type}</span>
}

/** The locator is visible on keyboard focus as well as hover. */
export function Citation({ id, locator, number, namespace = '' }: { id: SourceId; locator?: string; number?: number; namespace?: string }) {
  const index = sources.findIndex((source) => source.id === id)
  const source = sources[index]
  return <span className="citation"><a href={source.url} target="_blank" rel="noreferrer" aria-label={`Reference ${namespace}${number ?? index + 1}: ${source.title}, ${locator ?? source.locator}`}>[{namespace}{number ?? index + 1}]</a><span role="tooltip">{source.authors}, {source.year}. {source.title}. {locator ?? source.locator}.</span></span>
}

export function References() {
  return <section className="references" id="references" aria-labelledby="references-title"><h2 id="references-title">Primary references</h2><ol>{sources.map((source) => <li id={`ref-${source.id}`} key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><span>{source.authors}, {source.year}. {source.locator}.</span></li>)}</ol></section>
}

export function ArtifactFooter() {
  const repo = 'https://github.com/drcocktail/bdh-state-microscope'
  return <footer className="artifact-footer"><p>Independent educational work. No Pathway affiliation or endorsement.</p><nav aria-label="Artifact resources"><a href={repo}>Repository</a><a href={`${repo}/blob/final-push/README.md`}>README</a><a href={`${repo}/blob/final-push/LICENSE`}>MIT license</a><a href={`${repo}/blob/final-push/docs/SOURCE_AND_LICENSE_RECORD.md`}>Source and license record</a><a href={`${repo}/blob/final-push/docs/AI_DISCLOSURE.md`}>AI disclosure</a><a href="/dataforge-latent-reasoning-blog.pdf">Submitted blog v1 PDF</a><a href="/blog/">Interactive blog v2</a><a href={`${repo}/blob/final-push/CHANGELOG.md`}>Changelog</a></nav></footer>
}
