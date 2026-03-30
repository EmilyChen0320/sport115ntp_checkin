/** 將後端 area_name（中文）對應到 @svg-maps/taiwan 的 location.id */
const ZH_TO_SVG_ID: Record<string, string> = {
  基隆市: "keelung-city",
  臺北市: "taipei-city",
  台北市: "taipei-city",
  新北市: "new-taipei-city",
  桃園市: "taoyuan-city",
  新竹縣: "hsinchu-county",
  新竹市: "hsinchu-city",
  苗栗縣: "miaoli-county",
  臺中市: "taichung-city",
  台中市: "taichung-city",
  彰化縣: "changhua-county",
  南投縣: "nantou-county",
  雲林縣: "yunlin-county",
  嘉義市: "chiayi-city",
  嘉義縣: "chiayi-county",
  臺南市: "tainan-city",
  台南市: "tainan-city",
  高雄市: "kaohsiung-city",
  屏東縣: "pingtung-county",
  宜蘭縣: "yilan-county",
  花蓮縣: "hualien-county",
  臺東縣: "taitung-county",
  台東縣: "taitung-county",
  澎湖縣: "penghu-county",
  金門縣: "kinmen-county",
  連江縣: "lienchiang-county",
};

/** 英文 label（svg-maps）後備 */
const EN_TO_SVG_ID: Record<string, string> = {
  "Keelung City": "keelung-city",
  "Taipei City": "taipei-city",
  "New Taipei City": "new-taipei-city",
  "Taoyuan City": "taoyuan-city",
  "Hsinchu County": "hsinchu-county",
  "Hsinchu City": "hsinchu-city",
  "Miaoli County": "miaoli-county",
  "Taichung City": "taichung-city",
  "Changhua County": "changhua-county",
  "Nantou County": "nantou-county",
  "Yunlin County": "yunlin-county",
  "Chiayi City": "chiayi-city",
  "Chiayi County": "chiayi-county",
  "Tainan City": "tainan-city",
  "Kaohsiung City": "kaohsiung-city",
  "Pingtung County": "pingtung-county",
  "Yilan County": "yilan-county",
  "Hualien County": "hualien-county",
  "Taitung County": "taitung-county",
  "Penghu County": "penghu-county",
  "Kinmen County": "kinmen-county",
  "Lienchiang County": "lienchiang-county",
};

export function areaNameToTaiwanSvgId(areaName: string): string | null {
  const t = areaName.trim();
  if (!t) return null;
  if (ZH_TO_SVG_ID[t]) return ZH_TO_SVG_ID[t];
  if (EN_TO_SVG_ID[t]) return EN_TO_SVG_ID[t];
  return null;
}

/** 新北行政區：正規化為「〇〇區」以利比對 API */
export function normalizeNewTaipeiDistrictName(areaName: string): string {
  const t = areaName.trim().replace(/台/g, "臺");
  if (t.endsWith("區")) return t;
  if (t.length >= 2) return `${t}區`;
  return t;
}
