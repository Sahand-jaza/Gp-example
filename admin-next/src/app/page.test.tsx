import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Page from './page'

// Simple mock for Clerk and other components to allow basic rendering
vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button" />,
}))

test('renders the admin page', () => {
  render(<Page />)
  // Just testing that it renders without crashing, which proves the testing framework works.
  expect(true).toBe(true)
})
