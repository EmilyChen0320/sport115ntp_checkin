<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  detectNearbyPoints,
  getTeamProgress,
  submitCheckIn,
  type CheckInDetectPointView,
} from "../services/apiClient";
import { liffService } from "../services/liffService";
import teaminviteBg from "../assets/images/teaminvitebg.png";
import storeLogo from "../assets/images/85logo.png";
import mapLocationLogo from "../assets/images/MapLocationlogo.png";
import testLogo from "../assets/images/test.png";
import photoFrameImage from "../assets/images/photoframe.png";
import downloadIcon from "../assets/images/download.png";
import shareIcon from "../assets/images/share.png";

type CheckInPhase =
  | "loading"
  | "team-incomplete"
  | "gps-denied"
  | "detecting"
  | "no-point"
  | "point-found"
  | "already-checked"
  | "camera"
  | "compositing"
  | "uploading"
  | "upload-failed"
  | "success";

const router = useRouter();

const phase = ref<CheckInPhase>("loading");
const errorMessage = ref("");
const lineUserId = ref("");
const gpsLocation = ref("");
const nearbyPoint = ref<CheckInDetectPointView | null>(null);
const teamCheckedPointIds = ref<Set<string>>(new Set());
const selectedPhotoFile = ref<File | null>(null);
const previewUrl = ref("");
const compositedBlob = ref<Blob | null>(null);
const compositedPreviewUrl = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const isSharing = ref(false);
const shareErrorMessage = ref("");
const pointLogoLoadFailed = ref(false);
const MAX_CHECKIN_IMAGE_BYTES = 10 * 1024 * 1024;

const isBusy = computed(() =>
  ["loading", "detecting", "compositing", "uploading"].includes(phase.value),
);

const defaultPointLogo = computed(() => {
  const name = (nearbyPoint.value?.name ?? "").toLowerCase().replace(/\s+/g, "");
  const is85 = name.includes("85度c") || name.includes("85°c") || name.includes("85c");
  return is85 ? storeLogo : testLogo;
});

const pointLogo = computed(() => {
  const apiImgUrl = (nearbyPoint.value?.imgUrl ?? "").trim();
  if (apiImgUrl && !pointLogoLoadFailed.value) return apiImgUrl;
  return defaultPointLogo.value;
});

watch(
  () => nearbyPoint.value?.imgUrl,
  () => {
    pointLogoLoadFailed.value = false;
  },
);

function onPointLogoError(event: Event) {
  pointLogoLoadFailed.value = true;
  const target = event.target as HTMLImageElement | null;
  if (!target) return;
  target.src = defaultPointLogo.value as string;
}

const showGpsAndCamera = computed(() =>
  ["detecting", "no-point", "point-found", "camera", "compositing", "uploading", "upload-failed"].includes(phase.value),
);

const showCameraArea = computed(() =>
  ["point-found", "camera", "compositing", "uploading", "upload-failed"].includes(phase.value),
);

const successAreaTitle = computed(() => {
  const address = (nearbyPoint.value?.address ?? "").trim();
  const name = (nearbyPoint.value?.name ?? "").trim();
  const location = (nearbyPoint.value?.location ?? "").trim();
  const source = address || location || name;
  const districtMatch = source.match(/([^\s縣市]{1,8}(?:區|鄉|鎮|市))/);
  const district = districtMatch?.[1] ?? "";
  if (district) return `${district}「傳遞」完成`;
  if (name) return `${name}「傳遞」完成`;
  return "傳遞完成";
});

function setPhase(next: CheckInPhase, message = "") {
  phase.value = next;
  errorMessage.value = message;
}

function extractApiErrorMessage(error: unknown): string {
  const fallback = "上傳失敗，請稍後再試。";
  const err = error as {
    response?: { data?: unknown; status?: number };
    message?: unknown;
    code?: unknown;
  };
  const status = err?.response?.status;
  const responseData = err?.response?.data;
  const responseObj = typeof responseData === "object" && responseData !== null ? (responseData as Record<string, unknown>) : null;
  const resultObj =
    responseObj && typeof responseObj.result === "object" && responseObj.result !== null
      ? (responseObj.result as Record<string, unknown>)
      : null;
  const dataMessage =
    (typeof responseObj?.message === "string" && responseObj.message.trim()) ||
    (typeof resultObj?.message === "string" && resultObj.message.trim()) ||
    "";
  const htmlLikeBody =
    typeof responseData === "string" &&
    /<!doctype html|<html|<body|redirect/i.test(responseData);
  const combinedMessage = `${dataMessage} ${typeof err?.message === "string" ? err.message : ""}`.toLowerCase();
  const looksLikeSizeIssue = /too large|payload|file size|size limit|10mb|檔案過大|檔案大小|超過|容量/.test(combinedMessage);

  if (status === 413 || ((status === 422 || status === 400) && looksLikeSizeIssue)) {
    return "照片檔案過大，請選擇 10MB 以下圖片。";
  }
  if (status === 302 || htmlLikeBody) {
    return "上傳失敗，可能是照片檔案過大或登入狀態失效，請改用 10MB 以下圖片後再試。";
  }
  if (dataMessage) return dataMessage;
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  if (status === 409) return "您的隊伍已在此打卡點打過卡";
  if (err?.code === "ERR_BAD_RESPONSE") {
    return "上傳失敗，伺服器回應格式異常，請稍後再試。";
  }
  return fallback;
}

async function getCurrentGpsLocation(): Promise<string> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("裝置不支援 GPS 定位功能。");
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        resolve(`${lat},${lng}`);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("需要定位權限才能偵測附近打卡點。"));
          return;
        }
        reject(new Error("定位失敗，請確認 GPS 已開啟後重試。"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

function revokeUrl(url: string) {
  if (!url) return;
  URL.revokeObjectURL(url);
}

function replacePreview(file: File) {
  revokeUrl(previewUrl.value);
  previewUrl.value = URL.createObjectURL(file);
}

function replaceCompositedPreview(blob: Blob) {
  revokeUrl(compositedPreviewUrl.value);
  compositedPreviewUrl.value = URL.createObjectURL(blob);
}

function fileFromBlob(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

function onDownloadPhoto() {
  if (!compositedBlob.value) return;
  triggerDownload(compositedBlob.value, "checkin-framed.jpg");
}

async function onSharePhoto() {
  if (!compositedBlob.value || isSharing.value) return;
  isSharing.value = true;
  shareErrorMessage.value = "";
  const file = fileFromBlob(compositedBlob.value, "checkin-framed.jpg");
  const result = await liffService.shareCheckInPhoto({
    file,
    title: "打卡完成",
  });
  if (result === "unavailable") {
    shareErrorMessage.value = "目前裝置不支援直接分享，請先下載圖片後手動分享。";
  }
  isSharing.value = false;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("圖片載入失敗"));
    img.src = src;
  });
}

async function compositePhoto(userPhoto: File, frameUrl: string): Promise<Blob> {
  const [userPhotoUrl, frame] = await Promise.all([
    Promise.resolve(URL.createObjectURL(userPhoto)),
    loadImage(frameUrl),
  ]);
  try {
    const photo = await loadImage(userPhotoUrl);
    const canvas = document.createElement("canvas");
    canvas.width = frame.naturalWidth;
    canvas.height = frame.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("無法建立圖片合成畫布。");

    const targetW = canvas.width;
    const targetH = canvas.height;
    const photoRatio = photo.naturalWidth / photo.naturalHeight;
    const targetRatio = targetW / targetH;

    let drawW = targetW;
    let drawH = targetH;
    let dx = 0;
    let dy = 0;

    if (photoRatio > targetRatio) {
      // contain: 寬圖以寬度對齊，保留完整影像（上下可能留白）
      drawW = targetW;
      drawH = targetW / photoRatio;
      dy = (targetH - drawH) / 2;
    } else {
      // contain: 高圖以高度對齊，保留完整影像（左右可能留白）
      drawH = targetH;
      drawW = targetH * photoRatio;
      dx = (targetW - drawW) / 2;
    }

    ctx.drawImage(photo, dx, dy, drawW, drawH);
    ctx.drawImage(frame, 0, 0, targetW, targetH);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("合成失敗，請重拍一次。"));
          return;
        }
        resolve(blob);
      }, "image/jpeg", 0.92);
    });
  } finally {
    revokeUrl(userPhotoUrl);
  }
}

async function detectFlow() {
  try {
    setPhase("detecting");
    gpsLocation.value = await getCurrentGpsLocation();
    const points = await detectNearbyPoints(gpsLocation.value);
    if (!points.length) {
      setPhase("no-point");
      return;
    }
    nearbyPoint.value = points[0];
    const pointId = String(nearbyPoint.value.pointId ?? "").trim();
    const alreadyCheckedByTeamProgress = pointId ? teamCheckedPointIds.value.has(pointId) : false;
    if (nearbyPoint.value.alreadyCheckedByTeam || alreadyCheckedByTeamProgress) {
      setPhase("already-checked");
      return;
    }
    setPhase("point-found");
  } catch (e) {
    const message = e instanceof Error ? e.message : "無法取得定位資訊。";
    if (message.includes("定位權限")) {
      setPhase("gps-denied", message);
      return;
    }
    setPhase("no-point", message);
  }
}

function onCameraAreaClick() {
  if (isBusy.value || !showCameraArea.value) return;
  fileInputRef.value?.click();
}

async function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (file.size > MAX_CHECKIN_IMAGE_BYTES) {
    setPhase("upload-failed", "照片檔案過大，請選擇 10MB 以下圖片。");
    return;
  }
  selectedPhotoFile.value = file;
  replacePreview(file);
  try {
    setPhase("compositing");
    const blob = await compositePhoto(file, photoFrameImage);
    compositedBlob.value = blob;
    replaceCompositedPreview(blob);
    setPhase("camera");
  } catch (e) {
    setPhase("upload-failed", e instanceof Error ? e.message : "照片合成失敗。");
  }
}

async function doSubmit() {
  if (!nearbyPoint.value || !lineUserId.value || !gpsLocation.value || !compositedBlob.value) {
    setPhase("upload-failed", "資料不完整，請重新拍照後再試。");
    return;
  }
  try {
    setPhase("uploading");
    await submitCheckIn({
      lineUserId: lineUserId.value,
      checkInPointId: nearbyPoint.value.pointId,
      gpsLocation: gpsLocation.value,
      checkInPicture: fileFromBlob(compositedBlob.value, "checkin-framed.jpg"),
      filename: "checkin-framed.jpg",
    });
    setPhase("success");
  } catch (e) {
    setPhase("upload-failed", extractApiErrorMessage(e));
  }
}

async function bootstrap() {
  try {
    setPhase("loading");
    lineUserId.value = await liffService.getUserId();
    const team = await getTeamProgress(lineUserId.value);
    if (!team || team.members.length < 5) {
      setPhase("team-incomplete");
      return;
    }
    const checkedIds = new Set<string>();
    for (const member of team.members) {
      for (const point of member.checkInPoints) {
        const pointId = String(point.pointId ?? "").trim();
        if (pointId) checkedIds.add(pointId);
      }
    }
    teamCheckedPointIds.value = checkedIds;
    await detectFlow();
  } catch (e) {
    setPhase("team-incomplete", e instanceof Error ? e.message : "目前無法開始打卡流程。");
  }
}

onMounted(() => {
  void bootstrap();
});

onBeforeUnmount(() => {
  revokeUrl(previewUrl.value);
  revokeUrl(compositedPreviewUrl.value);
});
</script>

<template>
  <main class="relative min-h-screen w-full overflow-hidden text-[#2c2c2c]">
    <img :src="teaminviteBg" alt="" class="absolute inset-0 h-full w-full object-cover" />
    <section class="relative z-10 mx-auto flex min-h-screen w-full max-w-[393px] flex-col px-4 pt-[max(12px,env(safe-area-inset-top))] pb-6">
      <header class="relative flex items-center justify-center py-2">
        <button
          type="button"
          aria-label="返回首頁"
          class="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-[26px] leading-none"
          @click="router.push({ name: 'home' })"
        >
          ‹
        </button>
        <h1 class="text-[22px] font-bold leading-none">
          {{ phase === "success" ? successAreaTitle : "聖火傳遞打卡" }}
        </h1>
      </header>

      <!-- loading -->
      <div v-if="phase === 'loading'" class="mt-5 rounded-2xl bg-white/90 p-4 py-10 text-center text-[14px] shadow-[0_10px_24px_rgba(0,0,0,0.1)]">
        正在檢查隊伍狀態...
      </div>

      <!-- team-incomplete -->
      <div v-else-if="phase === 'team-incomplete'" class="mt-5 space-y-3 rounded-2xl bg-white/90 p-4 py-6 text-center shadow-[0_10px_24px_rgba(0,0,0,0.1)]">
        <p class="text-[18px] font-bold">您的隊伍尚未完成組隊</p>
        <p class="text-[13px] text-[#666]">需滿 5 位隊員才可開始聖火傳遞打卡。</p>
        <p v-if="errorMessage" class="text-[12px] text-[#674598]">{{ errorMessage }}</p>
        <button
          type="button"
          class="mx-auto block rounded-full bg-[#674598] px-5 py-2 text-[14px] font-bold text-white"
          @click="router.push({ name: 'teamDetail' })"
        >
          前往我的隊伍
        </button>
      </div>

      <!-- gps-denied -->
      <div v-else-if="phase === 'gps-denied'" class="mt-5 space-y-3 rounded-2xl bg-white/90 p-4 py-6 text-center shadow-[0_10px_24px_rgba(0,0,0,0.1)]">
        <img :src="mapLocationLogo" alt="" class="mx-auto h-[84px] w-[84px]" />
        <p class="text-[16px] font-bold">需要定位權限</p>
        <p class="text-[13px] text-[#666]">{{ errorMessage || "請開啟定位權限後重試。" }}</p>
        <button
          type="button"
          class="mx-auto block rounded-full bg-[#674598] px-5 py-2 text-[14px] font-bold text-white"
          @click="detectFlow"
        >
          重新偵測
        </button>
      </div>

      <!-- already-checked -->
      <div v-else-if="phase === 'already-checked'" class="mt-5 space-y-3 rounded-2xl bg-white/90 p-4 py-6 text-center shadow-[0_10px_24px_rgba(0,0,0,0.1)]">
        <img
          :src="pointLogo"
          alt=""
          class="mx-auto h-[96px] w-[96px] rounded-full object-cover"
          @error="onPointLogoError"
        />
        <p class="text-[16px] font-bold">此地點已被您或您的隊員完成！</p>
        <p class="text-[13px] text-[#666]">{{ nearbyPoint?.name }}</p>
        <button
          type="button"
          class="mx-auto block rounded-full bg-[#674598] px-5 py-2 text-[14px] font-bold text-white"
          @click="router.push({ name: 'teamDetail' })"
        >
          查看打卡進度
        </button>
      </div>

      <!-- success -->
      <div v-else-if="phase === 'success'" class="mt-6 space-y-4 text-center">
        <p class="text-[14px] text-[#666]">已完成此地點打卡，恭喜獲得一次傳遞紀錄。</p>
        <img
          v-if="compositedPreviewUrl"
          :src="compositedPreviewUrl"
          alt="打卡照片"
          class="mx-auto w-full max-w-[360px] rounded-xl border border-[#ddd]"
        />
        <div class="mx-auto grid w-full max-w-[360px] grid-cols-2 gap-2">
          <button
            type="button"
            class="flex items-center justify-center gap-1.5 rounded-full bg-[#BCA9D1] px-4 py-2.5 text-[14px] font-bold text-white"
            :disabled="!compositedBlob"
            @click="onDownloadPhoto"
          >
            <img :src="downloadIcon" alt="" class="h-4 w-4 object-contain" />
            下載圖片
          </button>
          <button
            type="button"
            class="flex items-center justify-center gap-1.5 rounded-full bg-[#674598] px-4 py-2.5 text-[14px] font-bold text-white disabled:opacity-50"
            :disabled="!compositedBlob || isSharing"
            @click="onSharePhoto"
          >
            <img :src="shareIcon" alt="" class="h-4 w-4 object-contain" />
            {{ isSharing ? "分享中..." : "分享" }}
          </button>
        </div>
        <p v-if="shareErrorMessage" class="text-[12px] text-[#a94442]">
          {{ shareErrorMessage }}
        </p>
        <button
          type="button"
          class="mx-auto mt-[28px] block bg-transparent px-2 py-1 text-[18px] font-bold text-[#222] underline"
          @click="router.push({ name: 'home' })"
        >
          返回首頁
        </button>
      </div>

      <div
        v-if="phase === 'success'"
        class="mt-auto -mx-4 bg-[#BCA9D1] px-3 py-2 text-center text-[12px] font-medium text-black"
      >
        下載圖片並分享至『新北運動聚點』FB指定貼文，還可獲得個人獎抽獎機會！
      </div>

      <!-- GPS + Camera composite layout (detecting / no-point / point-found / camera / compositing / uploading / upload-failed) -->
      <template v-else-if="showGpsAndCamera">
        <!-- GPS status card -->
        <div class="mt-5 rounded-2xl bg-white/90 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.1)]">
          <p class="text-center text-[18px] font-bold text-[#674598]">
            {{ phase === 'detecting' ? 'GPS定位中 ...' : 'GPS定位完成' }}
          </p>

          <div class="mx-auto mt-3 rounded-full bg-[#674598] px-4 py-1.5 text-center text-[12px] font-bold leading-tight text-white">
            請與店面招牌或圖示指定字樣合影(人臉須入鏡)
          </div>

          <!-- detecting -->
          <div v-if="phase === 'detecting'" class="mt-4 flex items-center gap-3 rounded-xl bg-[#f0ecf5] p-3">
            <div class="flex-1">
              <p class="animate-pulse text-[14px] font-bold text-[#674598]">正在偵測附近打卡點...</p>
              <p class="mt-1 text-[12px] text-[#666]">請稍候，正在比對您目前位置。</p>
            </div>
            <img :src="mapLocationLogo" alt="" class="h-[72px] w-[72px] animate-pulse" />
          </div>

          <!-- no-point -->
          <div v-else-if="phase === 'no-point'" class="mt-4 flex items-center gap-3 rounded-xl bg-[#f0ecf5] p-3">
            <div class="flex-1">
              <p class="text-[14px] font-bold text-[#c0392b]">
                未偵測到可打卡地點，<br />請確認已到達指定位置、有無開啟GPS定位。
              </p>
              <p v-if="errorMessage" class="mt-1 text-[11px] text-[#666]">{{ errorMessage }}</p>
              <button
                type="button"
                class="mt-2 rounded-full border border-[#674598] px-3 py-1 text-[12px] font-bold text-[#674598]"
                @click="detectFlow"
              >
                重新偵測
              </button>
            </div>
            <img :src="mapLocationLogo" alt="" class="h-[72px] w-[72px] opacity-85" />
          </div>

          <!-- point-found / camera / compositing / uploading / upload-failed -->
          <div v-else class="mt-4 flex items-center gap-3 rounded-xl bg-[#f0ecf5] p-3">
            <div class="flex-1">
              <p class="text-[15px] font-bold">{{ nearbyPoint?.name }}</p>
              <p class="mt-0.5 text-[12px] text-[#666]">{{ nearbyPoint?.address || nearbyPoint?.location }}</p>
              <p class="mt-1 text-[13px] font-bold text-[#27ae60]">✓ 您在打卡範圍內</p>
            </div>
            <img :src="pointLogo" alt="" class="h-[72px] w-[72px] object-contain" @error="onPointLogoError" />
          </div>
        </div>

        <!-- Camera / photo area -->
        <div class="mt-10 w-full">
          <div
            class="relative mx-auto flex h-[360px] w-[calc(100%-16px)] max-w-[360px] flex-col items-center justify-center overflow-visible rounded-2xl border-2 bg-[#2c2c2c]"
            :class="{ 'cursor-pointer': showCameraArea && !isBusy }"
            role="button"
            :tabindex="showCameraArea ? 0 : -1"
            @click="onCameraAreaClick"
          >
            <div class="pointer-events-none absolute -left-3 -top-5 h-5 w-5 border-l-[3px] border-t-[3px] border-[#222]" />
            <div class="pointer-events-none absolute -right-3 -top-5 h-5 w-5 border-r-[3px] border-t-[3px] border-[#222]" />
            <div class="pointer-events-none absolute -bottom-5 -left-3 h-5 w-5 border-b-[3px] border-l-[3px] border-[#222]" />
            <div class="pointer-events-none absolute -bottom-5 -right-3 h-5 w-5 border-b-[3px] border-r-[3px] border-[#222]" />
          <!-- compositing spinner -->
          <div v-if="phase === 'compositing'" class="py-8 text-center text-[14px] text-white/80">
            正在套用活動圖框...
          </div>

          <!-- uploading spinner -->
          <div v-else-if="phase === 'uploading'" class="py-8 text-center text-[14px] text-white/80">
            上傳打卡中，請稍候...
          </div>

          <!-- upload-failed -->
          <div v-else-if="phase === 'upload-failed'" class="space-y-2 py-6 text-center">
            <p class="text-[14px] font-bold text-[#e74c3c]">上傳失敗</p>
            <p class="text-[12px] text-white/70">{{ errorMessage || "請稍後重試。" }}</p>
            <div class="flex justify-center gap-2 pt-1">
              <button
                type="button"
                class="rounded-full bg-white/20 px-4 py-1.5 text-[12px] font-bold text-white"
                @click.stop="onCameraAreaClick"
              >
                重新拍照
              </button>
              <button
                type="button"
                class="rounded-full bg-[#674598] px-4 py-1.5 text-[12px] font-bold text-white"
                @click.stop="doSubmit"
              >
                重新上傳
              </button>
            </div>
          </div>

          <!-- preview -->
          <div v-else-if="phase === 'camera' && previewUrl" class="h-full w-full p-3">
            <img
              :src="previewUrl"
              alt="拍照預覽"
              class="h-full w-full rounded-lg object-contain"
            />
          </div>

          <!-- default: camera prompt -->
          <div v-else class="flex flex-col items-center gap-2 py-10">
            <svg class="h-10 w-10 text-white/70" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <p class="rounded-full border border-white/70 px-5 py-1.5 text-[13px] text-white/90">
              {{ showCameraArea ? '點擊此處拍照上傳打卡照片' : '偵測到打卡點後即可拍照' }}
            </p>
          </div>
          </div>
        </div>

        <!-- camera actions (outside photo frame) -->
        <div
          v-if="phase === 'camera'"
          class="mt-8 mb-[max(20px,env(safe-area-inset-bottom))] flex w-full gap-2 px-1"
        >
          <button
            type="button"
            class="flex-1 rounded-full bg-[#9f8fb2] px-6 py-2.5 text-[14px] font-bold text-white"
            @click.stop="onCameraAreaClick"
          >
            重拍
          </button>
          <button
            type="button"
            class="flex-1 rounded-full bg-[#674598] px-6 py-2.5 text-[14px] font-bold text-white"
            :disabled="isBusy || !compositedBlob"
            @click.stop="doSubmit"
          >
            送出打卡
          </button>
        </div>
      </template>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        @change="onPhotoSelected"
      />
    </section>
  </main>
</template>
