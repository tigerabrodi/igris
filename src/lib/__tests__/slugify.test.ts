import { describe, expect, it } from 'vitest'
import { slugify } from '../utils'

describe('slugify', () => {
  it('converts spaces to dashes', () => {
    expect(slugify('hello world')).toBe('hello-world')
    expect(slugify('multiple   spaces  here')).toBe('multiple-spaces-here')
  })

  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('UPPER CASE')).toBe('upper-case')
  })

  it('removes special characters and accents', () => {
    expect(slugify('hello! @world#')).toBe('hello-world')
    expect(slugify('café & résumé')).toBe('caf-rsum')
  })

  it('handles consecutive dashes and cleans them up', () => {
    expect(slugify('hello---world')).toBe('hello-world')
    expect(slugify('hello   ---   world')).toBe('hello-world')
  })

  it('removes leading and trailing dashes', () => {
    expect(slugify('--hello world--')).toBe('hello-world')
    expect(slugify('---hello---')).toBe('hello')
  })

  it('handles complex cases combining multiple rules', () => {
    expect(slugify('  Hello! @WORLD & café  --')).toBe('hello-world-caf')
    expect(slugify('The !!! Amazing ### Story')).toBe('the-amazing-story')
  })
})
