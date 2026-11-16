import type { Poem, Region } from '../types'
import { poems as tangPoems } from './poems'
import { regionById as tangRegionById, regions as tangRegions } from './regions'
import { songPoems } from './songPoems'
import { songRegions } from './songRegions'

export type CollectionId = 'tang' | 'song'

export interface Collection {
  id: CollectionId
  dynasty: '唐' | '宋'
  noun: '诗' | '词'
  unit: '道' | '路'
  label: string
  poems: Poem[]
  regions: Region[]
  regionById: Record<string, Region>
  defaultRegionId: string
  navMap: string
  libraryName: string
  heroKicker: string
  heroTitle: string
  heroEmphasis: string
  heroIntro: string
  statLabel: string
  regionStatLabel: string
  authorLabel: string
  mapTitle: string
  mapSubtitle: string
  indexTitle: string
  indexIntro: string
  indexFootnote: string
  mapBadge: string
  mapAllButton: string
  mapFooter: string
  searchPlaceholder: string
  searchAria: string
  quote: { seal: string; label: string; text: string; author: string; work: string; place: string; poemId: number }
  aboutText: string
  aboutFeatures: [string, string][]
  aboutNote: string
  footerSource: string
  librarySubtitle: string
  libraryPlaceholder: string
  libraryAllRegions: string
}

const songRegionById = Object.fromEntries(songRegions.map(region => [region.id, region]))

export const collections: Record<CollectionId, Collection> = {
  tang: {
    id: 'tang',
    dynasty: '唐',
    noun: '诗',
    unit: '道',
    label: '唐诗',
    poems: tangPoems,
    regions: tangRegions,
    regionById: tangRegionById,
    defaultRegionId: 'jingji',
    navMap: '诗地图',
    libraryName: '唐诗三百',
    heroKicker: 'TANG DYNASTY · 618—907',
    heroTitle: '把唐诗，读回',
    heroEmphasis: '万里山河',
    heroIntro: '盛唐十五道，三百首诗意坐标。循着地图，重逢长安的月、江南的雨与塞外的风。',
    statLabel: '首唐诗',
    regionStatLabel: '道山河',
    authorLabel: '位诗人',
    mapTitle: '盛唐疆域图',
    mapSubtitle: '开元二十九年（741）· 十五道行政区划示意',
    indexTitle: '十五道索引',
    indexIntro: '择一道山水，读一方诗意。',
    indexFootnote: '无明确地点者，依诗人活动地或籍贯索引。',
    mapBadge: '诗意地图',
    mapAllButton: '全部诗作',
    mapFooter: '聚合圆点按行政区划收录诗作',
    searchPlaceholder: '寻一首诗、一位诗人',
    searchAria: '搜索诗名、作者、诗句或地点',
    quote: {
      seal: '月',
      label: '诗中一景',
      text: '“长安一片月，万户捣衣声。”',
      author: '李白 · 子夜吴歌',
      work: '子夜吴歌·秋歌',
      place: '京畿道 · 长安',
      poemId: 281,
    },
    aboutText: '“诗词山河”以唐玄宗开元年间十五道为地理框架，将三百首唐诗放回长安、洛阳、巴蜀、江南与塞北，让阅读不止于字句，也成为一次山川行旅。',
    aboutFeatures: [
      ['十五道', '点击地图或行政区索引，查看地域诗选。'],
      ['三百首', '诗名、作者、全文与浅解均可检索阅读。'],
      ['地理索引', '优先依诗中地名与行旅归类，其余依诗人活动地或籍贯。'],
    ],
    aboutNote: '本地图为文化阅读示意，行政区划边界经过概括；无明确创作地的归属不代表学术定论。',
    footerSource: '诗文据开源《唐诗三百首》整理 · 地理归类仅供阅读参考',
    librarySubtitle: '三百首诗，六十九位诗人，十五道山河。',
    libraryPlaceholder: '在当前范围搜索诗名、作者或诗句',
    libraryAllRegions: '全部十五道',
  },
  song: {
    id: 'song',
    dynasty: '宋',
    noun: '词',
    unit: '路',
    label: '宋词',
    poems: songPoems,
    regions: songRegions,
    regionById: songRegionById,
    defaultRegionId: 'liangzhe',
    navMap: '词地图',
    libraryName: '宋词三百',
    heroKicker: 'NORTHERN SONG · 960—1127',
    heroTitle: '把宋词，读回',
    heroEmphasis: '汴水山河',
    heroIntro: '北宋二十四路，三百首词心坐标。循着地图，重逢汴京的灯、西湖的雨与塞下的秋。',
    statLabel: '首宋词',
    regionStatLabel: '路山河',
    authorLabel: '位词人',
    mapTitle: '北宋疆域图',
    mapSubtitle: '元丰年间（1078—1085）· 二十四路行政区划示意',
    indexTitle: '二十四路索引',
    indexIntro: '择一路山水，读一阕词心。',
    indexFootnote: '无明确地点者，依词人活动地或籍贯索引。',
    mapBadge: '词意地图',
    mapAllButton: '全部词作',
    mapFooter: '聚合圆点按行政区划收录词作',
    searchPlaceholder: '寻一首词、一位词人',
    searchAria: '搜索词名、词人、词句或地点',
    quote: {
      seal: '词',
      label: '词中一景',
      text: '“大江东去，浪淘尽，千古风流人物。”',
      author: '苏轼 · 念奴娇',
      work: '念奴娇·大江东去',
      place: '淮南西路 · 黄州',
      poemId: 281,
    },
    aboutText: '“诗词山河”以北宋元丰年间二十四路为地理框架，将三百首宋词放回汴京、洛阳、两浙、巴蜀与岭外，让阅读不止于字句，也成为一次山川行旅。',
    aboutFeatures: [
      ['二十四路', '点击地图或行政区索引，查看地域词选。'],
      ['三百首', '词名、词人、全文与浅释均可检索阅读。'],
      ['地理索引', '优先依词中地名与行旅归类，其余依词人活动地或籍贯。'],
    ],
    aboutNote: '本地图为文化阅读示意，行政区划边界经过概括；无明确创作地的归属不代表学术定论。',
    footerSource: '词文据开源《宋词三百首》及补选名篇整理 · 地理归类仅供阅读参考',
    librarySubtitle: '三百首词，八十四位词人，二十四路山河。',
    libraryPlaceholder: '在当前范围搜索词名、词人或词句',
    libraryAllRegions: '全部二十四路',
  },
}
