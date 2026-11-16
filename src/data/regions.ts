import type { Region } from '../types'

export const regions: Region[] = [
  {
    id: 'jingji', name: '京畿道', capital: '京兆府 · 长安', modern: '今陕西中部',
    description: '帝都所在，朱雀大街车马如织。终南积雪、曲江春水与大明宫早朝，都在这里化作诗篇。',
    path: 'M401 406 L455 357 L538 380 L527 437 L455 458 L390 439 Z', center: [464, 411],
  },
  {
    id: 'duji', name: '都畿道', capital: '河南府 · 洛阳', modern: '今河南西部',
    description: '东都洛阳枕洛水而望嵩山，牡丹花城与金谷旧园，承载着盛唐诗人的繁华记忆与兴亡之思。',
    path: 'M538 380 L598 391 L641 385 L649 438 L596 466 L527 437 Z', center: [589, 422],
  },
  {
    id: 'guannei', name: '关内道', capital: '京兆以北诸州', modern: '今陕西北部、内蒙古河套一带',
    description: '北临大漠，南接帝京。受降城外的羌笛与朔风，记录着边地将士的乡愁与豪兴。',
    path: 'M410 118 L520 93 L600 130 L600 335 L538 380 L455 357 L415 285 Z', center: [505, 238],
  },
  {
    id: 'henan', name: '河南道', capital: '汴州 · 洛阳以东诸州', modern: '今河南东部、山东、江苏北部',
    description: '黄河与运河交汇之地，东岳泰山雄踞其间。这里既有中原厚土，也有齐鲁礼乐余风。',
    path: 'M641 385 L675 356 L764 350 L838 321 L862 377 L840 443 L770 479 L697 460 L649 438 Z', center: [751, 407],
  },
  {
    id: 'hedong', name: '河东道', capital: '河中府 · 蒲州', modern: '今山西大部',
    description: '表里山河，汾水流贯。鹳雀楼上极目黄河，太行与吕梁之间多有慷慨之音。',
    path: 'M600 130 L675 155 L705 250 L675 356 L598 391 L538 380 L600 335 Z', center: [626, 265],
  },
  {
    id: 'hebei', name: '河北道', capital: '魏州 · 幽州诸镇', modern: '今河北、北京、天津及辽宁西部',
    description: '北依燕山，东达渤海。幽州台上的苍茫长叹与蓟门烽火，构成雄浑悲壮的北方诗境。',
    path: 'M675 155 L770 122 L864 130 L958 185 L925 240 L870 252 L838 321 L764 350 L675 356 L705 250 Z', center: [802, 239],
  },
  {
    id: 'longyou', name: '陇右道', capital: '鄯州 · 凉州诸镇', modern: '今甘肃、青海东部及西域交通沿线',
    description: '丝路驼铃穿过河西走廊，凉州词、白雪歌与轮台月色，写尽边塞的辽阔和离人的乡思。',
    path: 'M82 251 L175 213 L255 222 L327 177 L410 118 L415 285 L455 357 L401 406 L335 378 L290 320 L190 307 Z', center: [292, 284],
  },
  {
    id: 'shannandong', name: '山南东道', capital: '襄州 · 襄阳', modern: '今湖北大部、河南西南部',
    description: '汉水南下，荆楚云开。襄阳的鹿门夜月、武昌的黄鹤楼，见证无数登临与送别。',
    path: 'M527 437 L596 466 L649 438 L697 460 L680 523 L607 552 L522 506 Z', center: [609, 496],
  },
  {
    id: 'shannanxi', name: '山南西道', capital: '兴元府 · 梁州', modern: '今陕西南部、四川北部',
    description: '秦巴山地连接关中与蜀地，栈道连云、巴山夜雨，是行旅诗中深长的地理记忆。',
    path: 'M390 439 L455 458 L527 437 L522 506 L463 552 L375 526 L332 478 Z', center: [433, 493],
  },
  {
    id: 'jiannan', name: '剑南道', capital: '成都府', modern: '今四川中部、西部及云南北部',
    description: '锦官城外花重，蜀道云横。李白与杜甫的身影，使巴山蜀水成为唐诗最深厚的故乡之一。',
    path: 'M332 478 L375 526 L463 552 L459 625 L392 677 L298 649 L250 586 L275 520 Z', center: [354, 580],
  },
  {
    id: 'huainan', name: '淮南道', capital: '扬州 · 广陵', modern: '今安徽、江苏中部及湖北东部一隅',
    description: '江淮之间漕运繁盛，扬州明月与二十四桥箫声，映照着诗人的欢宴、羁旅和惜别。',
    path: 'M697 460 L770 479 L840 443 L828 501 L779 547 L711 535 L680 523 Z', center: [756, 503],
  },
  {
    id: 'jiangnandong', name: '江南东道', capital: '润州 · 苏州诸郡', modern: '今江苏南部、浙江、福建',
    description: '水乡泽国，人文清嘉。姑苏钟声、金陵旧梦和若耶溪春色，织成温润明丽的江南诗卷。',
    path: 'M711 535 L779 547 L828 501 L865 541 L843 600 L802 627 L779 684 L715 712 L657 667 L715 612 Z', center: [782, 597],
  },
  {
    id: 'jiangnanxi', name: '江南西道', capital: '洪州 · 江州诸郡', modern: '今江西、湖南大部',
    description: '洞庭浩渺，庐山秀出。贬谪与行旅在此交汇，留下江州琵琶、岳阳登临等不朽篇章。',
    path: 'M607 552 L680 523 L711 535 L715 612 L657 667 L601 625 Z', center: [654, 591],
  },
  {
    id: 'qianzhong', name: '黔中道', capital: '黔州 · 黔中诸郡', modern: '今贵州大部、湖南西部',
    description: '武陵溪山深远，夜郎道路迢遥。蛮烟瘴雨之外，也有桃源想象与贬谪文人的坚韧精神。',
    path: 'M463 552 L522 506 L607 552 L601 625 L535 659 L459 625 Z', center: [532, 586],
  },
  {
    id: 'lingnan', name: '岭南道', capital: '广州 · 韶州诸郡', modern: '今广东、广西及越南北部',
    description: '五岭以南，江海相连。梅岭远行、柳江登楼与丹橘丹心，为唐诗添上明丽而苍远的岭南一笔。',
    path: 'M459 625 L535 659 L601 625 L657 667 L715 712 L660 735 L570 716 L492 728 L392 677 Z M675 748 C691 739 705 747 698 757 C690 765 676 761 675 748 Z', center: [565, 687],
  },
]

export const regionById = Object.fromEntries(regions.map(region => [region.id, region]))
