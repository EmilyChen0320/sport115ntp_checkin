<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AxiosError } from "axios";
import createGroupDisabledImage from "../assets/images/create-group-disabled.png";
import createGroupEnabledImage from "../assets/images/create-group-enabled.png";
import avatarImage from "../assets/images/avatar.png";
import photoImage from "../assets/images/photo.png";
import { createTeam, getTeamProgress } from "../services/apiClient";
import { liffService } from "../services/liffService";

const router = useRouter();
const route = useRoute();
const iconInputRef = ref<HTMLInputElement | null>(null);
const FORM_DRAFT_KEY = "create-team-form-draft-v1";

const form = reactive({
  teamName: "",
  captainName: "",
  phone: "",
  email: "",
  agreed: false,
});
const isSubmitting = ref(false);
const isPageLoading = ref(true);
const isAlreadyInTeam = ref(false);
const submitError = ref("");
const iconFile = ref<File | null>(null);
const iconPreviewUrl = ref<string>(avatarImage);

const after = computed(() => {
  const q = route.query.after;
  if (q === "checkin" || q === "progress") return q;
  return "progress";
});

function redirectAfterCreate() {
  if (after.value === "checkin") return { name: "checkPlace" as const };
  return { name: "teamDetail" as const };
}

function openIconPicker() {
  iconInputRef.value?.click();
}

function onIconFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    submitError.value = "請選擇圖片檔（jpg / png 等）。";
    input.value = "";
    return;
  }
  if (iconPreviewUrl.value && iconPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(iconPreviewUrl.value);
  }
  iconFile.value = file;
  iconPreviewUrl.value = URL.createObjectURL(file);
  submitError.value = "";
}

const isTeamNameValid = computed(() => {
  const length = form.teamName.trim().length;
  return length >= 2 && length <= 12;
});

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

const isPhoneValid = computed(() => {
  const digits = normalizePhone(form.phone.trim());
  return /^09\d{8}$/.test(digits);
});

const isEmailValid = computed(() => {
  const email = form.email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
});

const canSubmit = computed(() => {
  return (
    isTeamNameValid.value &&
    form.captainName.trim().length > 0 &&
    isPhoneValid.value &&
    isEmailValid.value &&
    form.agreed &&
    Boolean(iconFile.value)
  );
});

function saveDraft() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    FORM_DRAFT_KEY,
    JSON.stringify({
      teamName: form.teamName,
      captainName: form.captainName,
      phone: form.phone,
      email: form.email,
      agreed: form.agreed,
    }),
  );
}

function restoreDraft() {
  if (typeof sessionStorage === "undefined") return;
  const raw = sessionStorage.getItem(FORM_DRAFT_KEY);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw) as Partial<typeof form>;
    form.teamName = typeof draft.teamName === "string" ? draft.teamName : "";
    form.captainName = typeof draft.captainName === "string" ? draft.captainName : "";
    form.phone = typeof draft.phone === "string" ? draft.phone : "";
    form.email = typeof draft.email === "string" ? draft.email : "";
    form.agreed = Boolean(draft.agreed);
  } catch {
    /* ignore */
  }
}

function clearDraft() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(FORM_DRAFT_KEY);
}

function onSubmit() {
  if (!canSubmit.value || isSubmitting.value) return;
  submitError.value = "";
  isSubmitting.value = true;
  void (async () => {
    try {
      const lineUserId = await liffService.getUserId();
      await createTeam({
        name: form.teamName.trim(),
        leaderId: lineUserId,
        leaderName: form.captainName.trim(),
        leaderPhone: form.phone.trim(),
        leaderEmail: form.email.trim(),
        icon: iconFile.value as File,
      });
      clearDraft();

      router.push(redirectAfterCreate());
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      const message = apiError.response?.data?.message || "";
      if (
        apiError.response?.status === 422 &&
        (message.includes("已加入其他隊伍") || message.includes("無法創建新隊伍"))
      ) {
        router.push(redirectAfterCreate());
        return;
      }
      submitError.value =
        message ||
        `建立隊伍失敗（${apiError.response?.status ?? "network"}），請確認 token、欄位與後端連線。`;
    } finally {
      isSubmitting.value = false;
    }
  })();
}

function openActivityRules() {
  router.push({
    name: "checkEvent",
    query: { from: "createTeam", after: after.value },
  });
}

onBeforeUnmount(() => {
  if (iconPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(iconPreviewUrl.value);
  }
});

onMounted(() => {
  void (async () => {
    restoreDraft();
    try {
      const lineUserId = await liffService.getUserId();
      const team = await getTeamProgress(lineUserId);
      isAlreadyInTeam.value = Boolean(team);
    } catch {
      // 檢查失敗不阻擋表單，避免網路瞬斷影響流程
      isAlreadyInTeam.value = false;
    } finally {
      isPageLoading.value = false;
    }
  })();
});

watch(
  () => [form.teamName, form.captainName, form.phone, form.email, form.agreed],
  () => {
    saveDraft();
  },
);
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[393px] bg-[#f2f0f4] px-4 pt-[max(10px,env(safe-area-inset-top))] pb-6 text-[#222]">
    <header class="relative flex items-center justify-center py-2">
      <button
        type="button"
        aria-label="返回首頁"
        class="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-[28px] leading-none"
        @click="router.push({ name: 'home' })"
      >
        ‹
      </button>
      <h1 class="text-[18px] font-bold leading-none">我要組隊</h1>
    </header>

    <section
      v-if="isPageLoading"
      class="mt-4 rounded-xl bg-white px-4 py-5 text-center text-[14px] text-[#666] shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
    >
      載入中…
    </section>

    <section
      v-else-if="isAlreadyInTeam"
      class="mt-4 rounded-xl bg-white px-4 py-5 text-center shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
    >
      <p class="text-[16px] font-bold text-[#222]">您已加入隊伍</p>
      <p class="mt-2 text-[13px] leading-6 text-[#555]">每位參加者僅可加入一支隊伍，無法重複建立。</p>
      <button
        type="button"
        class="mt-4 w-full rounded-full bg-linear-to-r from-[#674598] to-[#bca9d1] py-3 text-[15px] font-bold text-white"
        @click="router.push({ name: 'teamDetail' })"
      >
        前往我的隊伍
      </button>
    </section>

    <section v-else class="mt-4 rounded-2xl bg-[#ece8f2] p-3">
      <div class="flex items-center justify-between gap-3">
        <div class="flex-1 text-left">
          <p class="text-[15px] font-extrabold leading-tight text-[#6d4ca7]">邀請 4 位成員開啟團隊打卡</p>
          <p class="mt-1 text-[12px] text-[#333333cc]">點擊右方更換隊伍頭像</p>
        </div>
        <div class="relative mt-1 h-[86px] w-[86px] shrink-0 cursor-pointer" role="button" tabindex="0" @click="openIconPicker">
          <img :src="iconPreviewUrl" alt="隊伍頭像" class="block h-full w-full rounded-full object-cover" />
          <button
            type="button"
            aria-label="更換隊伍頭像"
            class="absolute -right-1 bottom-1 h-6 w-6 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
            @click.stop="openIconPicker"
          >
            <img :src="photoImage" alt="" class="block h-full w-full" />
          </button>
          <input
            ref="iconInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onIconFileChange"
          />
        </div>
      </div>
    </section>

    <section v-if="!isPageLoading && !isAlreadyInTeam" class="mt-4 rounded-[26px] bg-white px-4 py-5 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
      <div class="space-y-6">
        <label class="block">
          <p class="mb-2 text-[15px] font-bold leading-none">隊伍名稱 *</p>
          <input
            v-model="form.teamName"
            type="text"
            placeholder="請輸入隊伍名稱（2-12字）"
            class="h-11 w-full rounded-xl border border-[#e5e5e5] px-4 text-[15px] text-[#222] placeholder:text-[#b8b8b8] outline-none"
          />
        </label>

        <label class="block">
          <p class="mb-2 text-[15px] font-bold leading-none">隊長姓名 *</p>
          <input
            v-model="form.captainName"
            type="text"
            placeholder="請輸入您的姓名"
            class="h-11 w-full rounded-xl border border-[#e5e5e5] px-4 text-[15px] text-[#222] placeholder:text-[#b8b8b8] outline-none"
          />
        </label>

        <label class="block">
          <p class="mb-2 text-[15px] font-bold leading-none">聯絡電話 *</p>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="請輸入手機號碼（例：0910-173-320）"
            class="h-11 w-full rounded-xl border border-[#e5e5e5] px-4 text-[15px] text-[#222] placeholder:text-[#b8b8b8] outline-none"
          />
          <p v-if="form.phone.trim() && !isPhoneValid" class="mt-1 text-[12px] text-[#a40000]">
            請輸入正確手機號碼（例如 09xx-xxx-xxx）。
          </p>
        </label>

        <label class="block">
          <p class="mb-2 text-[15px] font-bold leading-none">E-mail *</p>
          <input
            v-model="form.email"
            type="email"
            placeholder="請輸入Email"
            class="h-11 w-full rounded-xl border border-[#e5e5e5] px-4 text-[15px] text-[#222] placeholder:text-[#b8b8b8] outline-none"
          />
          <p v-if="form.email.trim() && !isEmailValid" class="mt-1 text-[12px] text-[#a40000]">
            請輸入正確 Email 格式。
          </p>
        </label>
      </div>

      <label class="mt-5 flex items-start gap-2">
        <input
          v-model="form.agreed"
          type="checkbox"
          class="mt-1 h-5 w-5 rounded border border-[#888] accent-[#6d4ca7]"
        />
        <span class="text-[13px] leading-6 text-[#333]">
          我已閱讀並
          <button type="button" class="underline text-[#6d4ca7]" @click="openActivityRules">同意活動規則</button>
          與
          <button type="button" class="underline text-[#6d4ca7]" @click="openActivityRules">個資聲明</button>
        </span>
      </label>
      <p v-if="submitError" class="mt-3 rounded-lg bg-[#ffe8e8] px-3 py-2 text-[12px] text-[#a40000]">
        {{ submitError }}
      </p>

      <button
        type="button"
        class="mt-6 block w-full rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
        :disabled="!canSubmit || isSubmitting"
        @click="onSubmit"
      >
        <img
          :src="canSubmit ? createGroupEnabledImage : createGroupDisabledImage"
          alt="建立隊伍"
          class="block h-auto w-full"
        />
      </button>
    </section>
  </main>
</template>
