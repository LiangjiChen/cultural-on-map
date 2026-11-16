import type { Poem } from '../types'
import { songPoems1 } from './song-poems-1'
import { songPoems2 } from './song-poems-2'
import { songPoems3 } from './song-poems-3'
import { songPoems4 } from './song-poems-4'
import { songPoems5 } from './song-poems-5'
import { songPoems6 } from './song-poems-6'

export const songPoems: Poem[] = [
  ...songPoems1,
  ...songPoems2,
  ...songPoems3,
  ...songPoems4,
  ...songPoems5,
  ...songPoems6,
]
