import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('BDH State Microscope learning journey', () => {
  it('opens on a real collision and recovers with separated addresses', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('Parity pass')).toBeInTheDocument()
    expect(screen.getByText('recall breaks')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Separated/ }))
    expect(screen.getByText('recall holds')).toBeInTheDocument()
    expect(screen.getByText('A → amber', { selector: '.verdict strong' })).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
  })

  it('requires a prediction before revealing the computed chunk-parity result', async () => {
    const user = userEvent.setup()
    render(<App />)

    const reveal = screen.getByRole('button', { name: 'Reveal computed result' })
    expect(reveal).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Outputs stay the same' }))
    expect(reveal).toBeEnabled()
    await user.click(reveal)
    expect(screen.getByText('Correct.')).toBeInTheDocument()
    expect(screen.getByText(/Maximum full-vs-chunk error/)).toBeInTheDocument()
  })

  it('unlocks and assesses the mechanism teach-back', async () => {
    const user = userEvent.setup()
    render(<App />)

    const compare = screen.getByRole('button', { name: 'Compare with the mechanism' })
    expect(compare).toBeDisabled()
    await user.type(
      screen.getByRole('textbox', { name: 'Your explanation' }),
      'The full matrix and fixed recurrent state are equivalent, but overlapping directions still cause interference.',
    )
    expect(compare).toBeEnabled()
    await user.click(compare)
    expect(screen.getByText('You connected all three parts.')).toBeInTheDocument()
    expect(screen.getByText('3/3 concepts captured')).toBeInTheDocument()
    expect(screen.getAllByText('Mentioned')).toHaveLength(3)
  })

  it('turns a short weak teach-back attempt into actionable feedback', async () => {
    const user = userEvent.setup()
    render(<App />)

    const compare = screen.getByRole('button', { name: 'Compare with the mechanism' })
    await user.type(screen.getByRole('textbox', { name: 'Your explanation' }), 'vytd bv')

    expect(compare).toBeEnabled()
    await user.click(compare)
    expect(screen.getByText('0/3 concepts captured')).toBeInTheDocument()
    expect(screen.getByText(/A place to start/)).toBeInTheDocument()
    expect(screen.getAllByText('Check this')).toHaveLength(3)
  })

  it('lets the reader inspect a pre-write token state', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Inspect A → amber' }))
    expect(screen.getByText(/1\/7 ; A → amber/)).toBeInTheDocument()
    expect(screen.getByText('[0, 0, 0]')).toBeInTheDocument()
  })

  it('exposes separate offline lab and blog entries', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Interrogate this result' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the lab' })).toHaveAttribute('href', '/lab/')
    expect(screen.getAllByRole('link', { name: 'Submitted blog v1 PDF' })[0]).toHaveAttribute('href', '/dataforge-latent-reasoning-blog.pdf')
  })
})
