<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

function goBack() {
  const from = typeof route.query.from === "string" ? route.query.from : "";
  if (from === "createTeam") {
    const after = route.query.after;
    const query =
      typeof after === "string" && (after === "checkin" || after === "progress")
        ? { after }
        : undefined;
    router.push({ name: "createTeam", query });
    return;
  }
  router.push({ name: "home" });
}

const orderedListClass =
  "mt-2 list-decimal list-outside space-y-2 pl-5 text-[14px] leading-6 text-[#333] marker:text-[#333]";
const orderedItemClass = "whitespace-pre-wrap pl-1";
const bodyTextClass = "text-[14px] leading-6 text-[#333]";

type EventRuleSection =
  | {
      kind: "preambleOl";
      title: string;
      preamble: string;
      items: readonly string[];
    }
  | {
      kind: "ruleParts";
      title: string;
      parts: readonly { heading: string; items: readonly string[] }[];
    }
  | {
      kind: "ol";
      title: string;
      items: readonly string[];
    };

const sections: readonly EventRuleSection[] = [
  {
    kind: "preambleOl",
    title: "一、活動辦法",
    preamble:
      "加入「新北市政府體育局」LINE官方帳號，進入【LINE傳聖火抽黃金】專屬頁面、建立或接受朋友邀請加入隊伍，完成指定打卡任務就有機會參加抽獎，將好禮帶回家！",
    items: [
      "活動期間：2026.05.01 至 2026.05.22 23:59止。",
      "活動說明：本活動以個人LINE帳號組隊參加，於本活動頁面點選建立或接受朋友邀請加入隊伍，每位隊員填寫相關資訊並同意加入活動隊伍後，即為成員之一，每位參加者僅可加入一支隊伍。每支隊伍須有5名隊員，即可開始進行LINE聖火傳遞打卡活動。",
      "本活動分為二條路線任務：【1】全臺22縣市聖火傳遞【2】新北市29行政區聖火傳遞。每條路線任務於活動期間僅可執行1次，完成一條路線任務即可獲得1次抽獎機會，二條路線任務獎項內容各有不同。",
    ],
  },
  {
    kind: "ruleParts",
    title: "二、活動規則",
    parts: [
      {
        heading: "路線一：全臺22縣市聖火傳遞",
        items: [
          "活動期間內，5位參與隊員可至全臺22縣市指定打卡點，依照本活動打卡流程請與店面招牌或圖示指定字樣合影（本人臉須入鏡），依步驟上傳照片，並出現「傳遞完成」頁面即代表完成該地點打卡。",
          "每一隊員須至少完成單一縣市聖火傳遞打卡，且不能重複縣市，全隊須累積完成5個不同縣市之打卡點。",
          "每一縣市聖火傳遞打卡完成，該縣市區塊即變色象徵點亮聖火、傳遞打卡完成。",
          "每一隊伍只要完成全臺5個不同縣市聖火傳遞打卡，即獲得抽獎資格。",
        ],
      },
      {
        heading: "路線二：新北市29行政區聖火傳遞",
        items: [
          "活動期間內，5位參與隊員可至新北市29行政區指定打卡點，依照本活動打卡流程請與店面招牌或圖示指定字樣合影（本人臉須入鏡），依步驟上傳照片，並出現「傳遞完成」頁面即代表完成該地點打卡。",
          "每一隊員須至少完成單一行政區聖火傳遞打卡，且不能重複行政區，全隊須累積完成10個不同行政區之打卡點。",
          "每一行政區聖火傳遞打卡完成，該行政區塊即變色象徵點亮聖火、傳遞打卡完成。",
          "每一隊伍只要完成新北市10個不同行政區聖火傳遞打卡，即獲得抽獎資格。",
        ],
      },
    ],
  },
  {
    kind: "ol",
    title: "三、注意事項",
    items: [
  "本活動僅限已設定手機門號的用戶透過LINE個人帳號參加，每個LINE帳號限為一人、單一使用。若發生系統無法正常運作的情形，請將LINE應用程式升級為最新版本。",
  "每位參加者僅能建立或參加一支活動隊伍，參加隊伍後即無法修改、退出、建立其他隊伍。",
  "單一路線每位隊員皆須進行聖火傳遞打卡，且須達成各路線規定條件即符合抽獎資格。",
  "每一隊員至指定傳遞點打卡，須與店面招牌或指定字樣（如：85度C、澎湖縣馬公北辰市場、連江縣南竿福澳港等）合影(本人臉部正面須入鏡) ，並依步驟上傳照片與活動指定圖框合成後，出現［傳遞完成］頁面即代表完成該地點打卡。",
  "本活動截止時間以本活動官方帳號系統主機時間為準。",
  "參加者參與本活動，即同意將照片使用權授權給主辦單位使用。",
  "得獎者若為中華民國境內居住之個人，依中華民國稅法規定，凡中獎價值（含累計）超過新臺幣1,000元，中獎者須依規定填寫並繳回相關中獎領據，中獎者若無法配合，則視為放棄中獎資格；獎項價值超過新臺幣20,000元（即20,001元以上）者，中獎者須辧理扣繳並繳納10%稅金（實際稅額扣繳，以本活動實際購入金額10%為準），若有其他延伸費用均由中獎者負擔，包含但不限於匯款手續費、印花稅及相關稅金及費用，得獎者未依規定繳納稅額，則視為放棄中獎資格。",
  "得獎者若為非中華民國境內居住之個人，得獎者依法須辧理扣繳並繳納20%稅金，若有其他延伸費用均由中獎者負擔，包含但不限於匯款手續費、印花稅及相關稅金及費用，得獎者未依規定繳納稅額，則視為放棄中獎資格。",
  "依照所得稅法第94-1條，並配合財政部實施「憑單無紙化」，主辦單位將以獎值申報為得獎者當年度綜合所得，並不再寄發書面各類扣繳憑單予得獎者。",
  "主辦單位有權檢視各活動參加者之活動參與行為、中獎情形、活動進行過程是否涉嫌異常情形，例如：人為操作、非屬正常方式取得、蓄意偽造、短時間異常多筆參與行為、透過任何電腦程式參與活動、詐欺或以任何其他不正當的方式，進行不實或虛偽之活動參與行為。活動參加者因上述情形所獲得之活動資格及獎額，主辦單位有權取消其活動資格或中獎資格，並保留犯罪追訴權及損害賠償請求權。如活動進行中發生參與者有違反常理、或涉嫌不法、或以惡意或不正當之方式影響活動等異常狀況者，主辦單位有權變更本活動規則。",
  "本活動如有任何因手機、網路、技術或其他任何不可歸責於活動主辦單位之事由，而使系統服務停止、中斷、誤送活動訊息、中獎通知或使參加者所上傳之資料有遲延、遺失、錯誤、無法辨識或毀損之情況或有其他任何影響參與者權益之情形，活動主辦單位不負任何法律責任，參加者亦不得因此異議。",
  "中獎獎項如有其他費用均由中獎者負擔，包含但不限於扣繳、規費、手續費等其他相關稅額及費用，如中獎者不願繳納或未於規定期限內繳納時，視同放棄。中獎者須配合主辦單位辦理相關領取手續流程，若無法配合領取流程與規範，視為放棄領獎權利，亦不得要求折換現金或兌換其他商品。",
  "若得獎者為未成年人（未滿20歲），須填寫法定代理人資料並簽名，且同時給付佐證資料，活動獎項為需由法定代理人領取。參加者於參加本活動之同時，即視為同意接受本活動之活動方式、活動辦法及注意事項等，如有違反前述任一內容之情事，本活動將取消其中獎資格。",
  "得獎者若為中華民國境內居住之個人，依中華民國稅法規定，凡中獎價值（含累計）超過新臺幣1,000元，中獎者須依規定填寫並繳回相關中獎領據，中獎者若無法配合，則視為放棄中獎資格；獎項價值超過新臺幣20,000元（即20,001元以上）者，中獎者須辧理扣繳並繳納10%稅金（實際稅額扣繳，以本活動實際購入金額10%為準），若有其他延伸費用均由中獎者負擔，包含但不限於匯款手續費、印花稅及相關稅金及費用，得獎者未依規定繳納稅額，則視為放棄中獎資格。",
  "得獎者若為非中華民國境內居住之個人，得獎者依法須辧理扣繳並繳納20%稅金，若有其他延伸費用均由中獎者負擔，包含但不限於匯款手續費、印花稅及相關稅金及費用，得獎者未依規定繳納稅額，則視為放棄中獎資格。",
  "依照所得稅法第94-1條，並配合財政部實施「憑單無紙化」，主辦單位將以獎值申報為得獎者當年度綜合所得，並不再寄發書面各類扣繳憑單予得獎者。",
  "主辦單位有權檢視各活動參加者之活動參與行為、中獎情形、活動進行過程是否涉嫌異常情形，例如：人為操作、非屬正常方式取得、蓄意偽造、短時間異常多筆參與行為、透過任何電腦程式參與活動、詐欺或以任何其他不正當的方式，進行不實或虛偽之活動參與行為。活動參加者因上述情形所獲得之活動資格及獎額，主辦單位有權取消其活動資格或中獎資格，並保留犯罪追訴權及損害賠償請求權。如活動進行中發生參與者有違反常理、或涉嫌不法、或以惡意或不正當之方式影響活動等異常狀況者，主辦單位有權變更本活動規則。",
  "本活動如有任何因手機、網路、技術或其他任何不可歸責於活動主辦單位之事由，而使系統服務停止、中斷、誤送活動訊息、中獎通知或使參加者所上傳之資料有遲延、遺失、錯誤、無法辨識或毀損之情況或有其他任何影響參與者權益之情形，活動主辦單位不負任何法律責任，參加者亦不得因此異議。",
  "中獎獎項如有其他費用均由中獎者負擔，包含但不限於扣繳、規費、手續費等其他相關稅額及費用，如中獎者不願繳納或未於規定期限內繳納時，視同放棄。中獎者須配合主辦單位辦理相關領取手續流程，若無法配合領取流程與規範，視為放棄領獎權利，亦不得要求折換現金或兌換其他商品。",
  "若得獎者為未成年人（未滿20歲），須填寫法定代理人資料並簽名，且同時給付佐證資料，活動獎項為需由法定代理人領取。參加者於參加本活動之同時，即視為同意接受本活動之活動方式、活動辦法及注意事項等，如有違反前述任一內容之情事，本活動將取消其中獎資格。",
  "主辦單位保有一切修改、變更、暫停及取消本活動的權利而不作事前通知，亦有對本活動之所有事宜作出解釋或裁決及變更活動獎項及辦法之權利，任何變更內容及其他詳細注意事項公布於賽會官網或社群，並不另行通知。"
]
  },
];
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[393px] bg-[#f2f0f4] px-3 pt-[max(10px,env(safe-area-inset-top))] pb-6 text-[#222]">
    <header class="relative flex items-center justify-center py-2">
      <button
        type="button"
        aria-label="返回首頁"
        class="absolute left-0 top-1/2 -translate-y-1/2 px-1 text-3xl leading-none"
        @click="goBack"
      >
        ‹
      </button>
      <h1 class="text-[22px] font-semibold leading-none">活動辦法</h1>
    </header>

    <section class="mt-3 space-y-4">
      <article
        v-for="section in sections"
        :key="section.title"
        class="rounded-xl border border-[#d8dae2] bg-[#ece8f2] px-3 py-3"
      >
        <h2 class="text-[16px] font-semibold">{{ section.title }}</h2>

        <template v-if="section.kind === 'preambleOl'">
          <p
            class="mt-2 whitespace-pre-wrap pl-5"
            :class="bodyTextClass"
          >
            {{ section.preamble }}
          </p>
          <ol :class="orderedListClass">
            <li
              v-for="(item, index) in section.items"
              :key="`${section.title}-${index}`"
              :class="orderedItemClass"
            >
              {{ item }}
            </li>
          </ol>
        </template>

        <template v-else-if="section.kind === 'ruleParts'">
          <div class="mt-2 space-y-4">
            <div
              v-for="part in section.parts"
              :key="part.heading"
              class="space-y-2"
            >
              <p class="whitespace-pre-wrap pl-5" :class="bodyTextClass">
                {{ part.heading }}
              </p>
              <ol :class="orderedListClass">
                <li
                  v-for="(item, index) in part.items"
                  :key="`${part.heading}-${index}`"
                  :class="orderedItemClass"
                >
                  {{ item }}
                </li>
              </ol>
            </div>
          </div>
        </template>

        <ol v-else :class="orderedListClass">
          <li
            v-for="(item, index) in section.items"
            :key="`${section.title}-${index}`"
            :class="orderedItemClass"
          >
            {{ item }}
          </li>
        </ol>
      </article>
    </section>
  </main>
</template>
