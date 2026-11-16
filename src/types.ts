export interface Poem {
  id: number
  title: string
  author: string
  type: string
  content: string[]
  regionId: string
  location: string
  heat: number
  summary: string
  explanation: string
  geoNote: string
}

export interface Region {
  id: string
  name: string
  capital: string
  modern: string
  description: string
  path: string
  center: [number, number]
}
