<template>
  <div class="mx-auto max-w-5xl px-6 py-6">
    <VPageHeader title="订阅" description="查看 V豆余额，用 V豆 购买创作者方案和听众会员。">
      <template #actions>
        <VButton :icon="ArrowPathIcon" :loading="refreshing" @click="load({ quiet: true, notify: true })">刷新</VButton>
      </template>
    </VPageHeader>

    <section class="panel p-5">
      <h2 class="section-title">V豆余额</h2>
      <VSkeleton v-if="pending" class="mt-3 h-8 w-32" />
      <p v-else-if="accountStore.signedIn && accountStore.vpointBalance !== null" class="num mt-2 text-2xl font-semibold text-ink">
        {{ accountStore.vpointBalance.toLocaleString() }}
        <span class="text-sm font-normal text-ink-subtle">V豆</span>
      </p>
      <p v-else-if="accountStore.signedIn" class="mt-2 text-sm text-ink-muted">暂时无法读取余额</p>
      <div v-else class="mt-3 flex flex-wrap items-center gap-3">
        <p class="text-sm text-ink-muted">登录后可以查看余额并购买。</p>
        <VButton variant="primary" size="sm" :loading="loggingIn" @click="login">登录官网账号</VButton>
      </div>
    </section>

    <section class="panel mt-4 grid gap-6 p-5 md:grid-cols-[1fr_1.2fr]">
      <div>
        <h2 class="section-title">当前订阅</h2>
        <VSkeleton v-if="pending" class="mt-3 h-8 w-48" />
        <template v-else-if="subscription?.plan">
          <p class="mt-2 flex flex-wrap items-center gap-2 text-lg font-semibold text-ink">
            {{ subscription.plan.name }}
            <VBadge :tone="statusTone(subscription.status)">{{ statusLabel(subscription.status) }}</VBadge>
          </p>
          <p v-if="periodLine(subscription)" class="mt-1 text-xs text-ink-subtle">{{ periodLine(subscription) }}</p>
        </template>
        <p v-else-if="!accountStore.signedIn" class="mt-2 text-sm text-ink-muted">登录后可以查看当前订阅。</p>
        <p v-else-if="subscriptionError" class="mt-2 text-sm text-ink-muted">{{ subscriptionError }}</p>
        <p v-else class="mt-2 text-sm text-ink-muted">没有生效中的订阅</p>
        <VButton
          v-if="subscription?.managedByStripe"
          class="mt-4"
          size="sm"
          :icon="ArrowTopRightOnSquareIcon"
          :loading="portalTarget === 'plan'"
          :disabled="paymentsOpen !== true || portalTarget !== ''"
          @click="openPortal('plan')"
        >
          管理订阅与账单
        </VButton>
        <p v-if="subscription?.managedByStripe && paymentsOpen === false" class="mt-2 text-2xs text-ink-subtle">付费功能维护中</p>
      </div>
      <div class="md:border-l md:border-line md:pl-6">
        <h2 class="section-title">本月额度</h2>
        <template v-if="accountStore.quotas">
          <div class="mt-3 space-y-4">
            <div>
              <p class="num text-2xl font-semibold text-ink">
                {{ accountStore.quotas.llm.used.toLocaleString() }}
                <span class="text-sm font-normal text-ink-subtle"> / {{ accountStore.quotas.llm.limit.toLocaleString() }}</span>
              </p>
              <VMeter class="mt-2" :value="accountStore.quotas.llm.used" :max="accountStore.quotas.llm.limit" :show-value="false" label="模型额度" />
              <p v-if="(accountStore.quotas.llm.borrowedOut || 0) > 0" class="mt-1 text-xs text-ink-subtle">
                其中借出 {{ (accountStore.quotas.llm.borrowedOut || 0).toLocaleString() }}
              </p>
            </div>
            <div>
              <p class="num text-2xl font-semibold text-ink">
                {{ accountStore.quotas.tts.used.toLocaleString() }}
                <span class="text-sm font-normal text-ink-subtle"> / {{ accountStore.quotas.tts.limit.toLocaleString() }}</span>
              </p>
              <VMeter class="mt-2" :value="accountStore.quotas.tts.used" :max="accountStore.quotas.tts.limit" :show-value="false" label="合成额度" />
              <p v-if="(accountStore.quotas.tts.borrowedOut || 0) > 0" class="mt-1 text-xs text-ink-subtle">
                其中借出 {{ (accountStore.quotas.tts.borrowedOut || 0).toLocaleString() }}
              </p>
            </div>
          </div>
          <p v-if="accountStore.quotas.periodEnd" class="mt-3 text-xs text-ink-subtle">
            额度将于 {{ formatBillingDate(accountStore.quotas.periodEnd) }} 重置
          </p>
        </template>
        <p v-else class="mt-2 text-sm text-ink-muted">订阅后即可获得每月的模型额度和合成额度。</p>
        <div v-if="accountStore.signedIn" class="mt-4 border-t border-line pt-4">
          <VSwitch
            :model-value="Boolean(accountStore.account?.allowQuotaBorrow)"
            :disabled="borrowSaving"
            label="额度不足时允许互相借用"
            @update:model-value="setBorrow"
          />
          <p class="mt-2 text-xs text-ink-subtle">1 个合成字符约换成 {{ llmCharsPerTtsChar }} 个模型字符。借用按成本向上取整，本周期已经借出的不会退回。</p>
        </div>
      </div>
    </section>

    <section class="mt-6">
      <h2 class="mb-3 text-sm font-semibold text-ink">可选方案</h2>
      <div v-if="pending" class="grid gap-3 sm:grid-cols-2">
        <VSkeleton v-for="i in 2" :key="i" class="h-48" />
      </div>
      <div v-else-if="plansError" class="panel">
        <VEmptyState compact :icon="CreditCardIcon" :title="plansError">
          <VButton @click="load({ notify: true })">重试</VButton>
        </VEmptyState>
      </div>
      <div v-else-if="!plans.length" class="panel">
        <VEmptyState compact :icon="CreditCardIcon" title="还没有可购买的方案" />
      </div>
      <ul v-else class="grid gap-3 sm:grid-cols-2">
        <li v-for="plan in plans" :key="plan.id" class="panel flex flex-col p-5" :class="isCurrentPlan(plan.id) && 'border-accent ring-1 ring-accent/40'">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-sm font-semibold text-ink">{{ plan.name }}</h3>
            <VBadge v-if="isCurrentPlan(plan.id)" tone="accent">当前方案</VBadge>
            <VBadge v-else-if="plan.isFree" tone="success">免费</VBadge>
          </div>
          <p v-if="plan.vpointPrice" class="num mt-3 text-lg font-semibold text-ink">{{ formatPrice(plan.vpointPrice, "VPT") }}</p>
          <p v-if="plan.interval === 'month' || plan.interval === 'year'" class="text-xs text-ink-subtle">{{ plan.interval === "month" ? "一个月" : "一年" }}</p>
          <p class="num mt-3 text-2xl font-semibold text-ink">{{ (plan.monthlyTtsQuota ?? plan.monthlyCharacterQuota ?? 0).toLocaleString() }}</p>
          <p class="text-xs text-ink-subtle">合成字 / 月</p>
          <p class="num mt-3 text-2xl font-semibold text-ink">{{ (plan.monthlyLlmQuota ?? 0).toLocaleString() }}</p>
          <p class="text-xs text-ink-subtle">模型字 / 月</p>
          <ul class="mt-4 flex flex-1 flex-col gap-2">
            <li v-for="(feature, index) in planFeatures(plan.description)" :key="index" class="flex gap-2 text-sm text-ink">
              <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
              <span class="min-w-0 break-words">{{ feature }}</span>
            </li>
          </ul>
          <template v-if="plan.purchasable && !isCurrentPlan(plan.id)">
            <VButton
              class="mt-4"
              variant="primary"
              block
              :loading="purchaseLoading && pendingBuy?.id === plan.id"
              :disabled="purchaseLoading || shortOf(plan.vpointPrice)"
              @click="askBuy('plan', plan.id, plan.name, plan.vpointPrice)"
            >
              用 V豆 购买
            </VButton>
            <p v-if="shortOf(plan.vpointPrice)" class="mt-2 text-2xs text-ink-subtle">V豆不足</p>
          </template>
          <VButton v-else class="mt-4" block disabled>{{ isCurrentPlan(plan.id) ? "当前方案" : "暂不可购买" }}</VButton>
        </li>
      </ul>
    </section>

    <section class="mt-6">
      <h2 class="mb-3 text-sm font-semibold text-ink">听众会员</h2>
      <section v-if="openMemberships.length" class="panel mb-3">
        <div class="panel-header">当前会员</div>
        <ul class="divide-y divide-line">
          <li v-for="(item, index) in openMemberships" :key="`${item.plan?.id || 'plan'}-${index}`" class="flex flex-wrap items-center gap-3 px-4 py-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm text-ink">{{ item.plan?.name || "听众会员" }}</p>
              <p class="text-2xs text-ink-subtle">{{ statusLabel(item.status) }}</p>
              <p v-if="periodLine(item)" class="text-2xs text-ink-subtle">{{ periodLine(item) }}</p>
            </div>
            <div v-if="item.managedByStripe" class="flex flex-col items-end gap-1">
              <VButton size="sm" :loading="portalTarget === 'membership'" :disabled="paymentsOpen !== true || portalTarget !== ''" @click="openPortal('membership')">
                管理会员
              </VButton>
              <p v-if="paymentsOpen === false" class="text-2xs text-ink-subtle">付费功能维护中</p>
            </div>
          </li>
        </ul>
      </section>
      <div v-if="pending" class="space-y-2">
        <VSkeleton v-for="i in 2" :key="i" class="h-24" />
      </div>
      <div v-else-if="membershipError" class="panel">
        <VEmptyState compact :icon="CreditCardIcon" :title="membershipError">
          <VButton @click="load({ notify: true })">重试</VButton>
        </VEmptyState>
      </div>
      <VEmptyState v-else-if="!membershipPlans.length" class="panel" title="还没有可购买的听众会员" />
      <ul v-else class="grid gap-3 sm:grid-cols-2">
        <li v-for="plan in membershipPlans" :key="plan.id" class="panel flex flex-col gap-3 p-4">
          <div class="min-w-0">
            <p class="text-base font-semibold text-ink">{{ plan.name }}</p>
            <p v-if="plan.description" class="mt-1 whitespace-pre-line break-words text-sm text-ink-muted">{{ plan.description }}</p>
            <p v-if="plan.interval === 'month' || plan.interval === 'year'" class="mt-1 text-xs text-ink-subtle">
              {{ plan.interval === "month" ? "一个月" : "一年" }}
            </p>
          </div>
          <div class="mt-auto flex items-center justify-between gap-3">
            <span class="num text-lg text-ink">{{ formatPrice(plan.vpointPrice, plan.currency || "VPT") || "暂不可购买" }}</span>
            <VButton
              variant="primary"
              :disabled="!plan.purchasable || shortOf(plan.vpointPrice) || purchaseLoading"
              :loading="purchaseLoading && pendingBuy?.id === plan.id"
              @click="askBuy('membership', plan.id, plan.name, plan.vpointPrice)"
            >
              {{ plan.purchasable ? "用 V豆 购买" : "暂不可购买" }}
            </VButton>
          </div>
          <p v-if="plan.purchasable && shortOf(plan.vpointPrice)" class="text-2xs text-ink-subtle">V豆不足</p>
        </li>
      </ul>
    </section>

    <section v-if="accountStore.signedIn" class="mt-6">
      <h2 class="mb-3 text-sm font-semibold text-ink">订单</h2>
      <div v-if="pending" class="space-y-2">
        <VSkeleton v-for="i in 3" :key="i" class="h-12" />
      </div>
      <div v-else-if="ordersError" class="panel">
        <VEmptyState compact :title="ordersError">
          <VButton @click="load({ notify: true })">重试</VButton>
        </VEmptyState>
      </div>
      <VEmptyState v-else-if="!orders.length" class="panel" title="还没有订单" />
      <ul v-else class="panel divide-y divide-line">
        <li v-for="order in orders" :key="order.orderNo" class="flex flex-wrap items-center gap-3 px-4 py-3">
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm text-ink">{{ order.title || kindLabel(order.kind) }}</span>
            <span class="num mt-0.5 block text-2xs text-ink-subtle">{{ kindLabel(order.kind) }} · {{ formatBillingDate(order.createdAt) }}</span>
          </span>
          <span class="text-2xs text-ink-muted">{{ orderStatusLabel(order.status) }}</span>
          <span class="min-w-0 text-right">
            <span class="num block text-sm text-ink">{{ formatPrice(order.amount, order.currency) }}</span>
            <span v-if="order.currency === 'CNY' && order.vpointAmount" class="num block text-2xs text-ink-subtle">
              到账 {{ order.vpointAmount.toLocaleString() }} V豆
            </span>
          </span>
          <VButton v-if="order.checkoutUrl" size="sm" :icon="ArrowTopRightOnSquareIcon" @click="openLink(order.checkoutUrl)">查看</VButton>
        </li>
      </ul>
    </section>

    <VConfirmDialog
      :open="pendingBuy !== null"
      title="确认购买"
      :message="confirmMessage"
      confirm-text="购买"
      cancel-text="取消"
      tone="primary"
      :loading="purchaseLoading"
      @confirm="confirmBuy"
      @cancel="clearBuy"
      @close="clearBuy"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useToast } from "vue-toastification";
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, CheckIcon, CreditCardIcon } from "@heroicons/vue/24/outline";
import VBadge from "@/components/ui/VBadge.vue";
import VButton from "@/components/ui/VButton.vue";
import VConfirmDialog from "@/components/ui/VConfirmDialog.vue";
import VEmptyState from "@/components/ui/VEmptyState.vue";
import VMeter from "@/components/ui/VMeter.vue";
import VPageHeader from "@/components/ui/VPageHeader.vue";
import VSkeleton from "@/components/ui/VSkeleton.vue";
import VSwitch from "@/components/ui/VSwitch.vue";
import { useAccountStore } from "@/stores/account";
import { formatBillingDate, formatPrice, periodLine, planFeatures } from "@/utils/billing";

interface PlanCard {
  id: string;
  name: string;
  description: string | null;
  monthlyCharacterQuota?: number;
  monthlyTtsQuota?: number;
  monthlyLlmQuota?: number;
  vpointPrice: number | null;
  interval: string;
  isFree: boolean;
  purchasable: boolean;
}

interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  vpointPrice: number | null;
  currency: string | null;
  interval: string;
  purchasable: boolean;
}

interface SubscriptionView {
  status: string;
  cancelAtPeriodEnd: boolean;
  managedByStripe: boolean;
  currentPeriodEnd: string | null;
  plan: { id: string; name: string } | null;
}

interface MembershipRow {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  managedByStripe: boolean;
  plan: { id: string; name: string } | null;
}

interface OrderRow {
  orderNo: string;
  title: string;
  kind: string;
  status: string;
  amount: number;
  currency: string;
  vpointAmount: number | null;
  createdAt: string;
  checkoutUrl: string | null;
}

interface PendingBuy {
  kind: "plan" | "membership";
  id: string;
  name: string;
  price: number;
  key: string;
}

const STATUS: Record<string, string> = {
  active: "生效中",
  trialing: "试用中",
  past_due: "待付款",
  incomplete: "未完成",
  canceled: "已取消",
  unpaid: "未支付",
};

const ORDER_STATUS: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  failed: "未完成",
  canceled: "已取消",
  refunding: "退款中",
  refunded: "已退款",
};

const KIND: Record<string, string> = {
  vpoint_recharge: "充值",
  creator_plan: "创作者方案",
  listener_membership: "听众会员",
  column_purchase: "专栏",
};

/** 与 home/shared/quota.ts 的 LLM_CHARS_PER_TTS_CHAR 一致。 */
const llmCharsPerTtsChar = 76;

let loadSeq = 0;

const toast = useToast();
const accountStore = useAccountStore();

const plans = ref<PlanCard[]>([]);
const membershipPlans = ref<MembershipPlan[]>([]);
const subscription = ref<SubscriptionView | null>(null);
const memberships = ref<MembershipRow[]>([]);
const orders = ref<OrderRow[]>([]);
const paymentsOpen = ref<boolean | null>(null);
const pending = ref(true);
const refreshing = ref(false);
const plansError = ref("");
const membershipError = ref("");
const subscriptionError = ref("");
const ordersError = ref("");
const loggingIn = ref(false);
const borrowSaving = ref(false);
const purchaseLoading = ref(false);
const portalTarget = ref<"" | "plan" | "membership">("");
const pendingBuy = ref<PendingBuy | null>(null);
const openedExternal = ref(false);

const confirmMessage = computed(() => {
  const buy = pendingBuy.value;
  if (!buy) return "";
  return `将用 ${buy.price.toLocaleString()} V豆 购买「${buy.name}」。购买后立即生效，不能在这里申请退回。`;
});

const openMemberships = computed(() => memberships.value.filter(isOpenMembership));

function statusLabel(status: string) {
  return STATUS[status] || status;
}

function statusTone(status: string): "success" | "warning" | "neutral" {
  if (status === "active" || status === "trialing") return "success";
  if (status === "past_due" || status === "incomplete") return "warning";
  return "neutral";
}

function orderStatusLabel(status: string) {
  return ORDER_STATUS[status] || status;
}

function kindLabel(kind: string) {
  return KIND[kind] || "订单";
}

function isCurrentPlan(planId: string) {
  const status = subscription.value?.status;
  const active = subscription.value?.plan?.id === planId && (status === "active" || status === "trialing");
  if (!active) return false;
  const end = subscription.value?.currentPeriodEnd;
  return !end || new Date(end).getTime() > Date.now();
}

function isOpenMembership(item: MembershipRow) {
  if (item.status === "canceled") return false;
  if (item.managedByStripe) return true;
  if (item.status !== "active" && item.status !== "trialing") return false;
  if (!item.currentPeriodEnd) return true;
  return new Date(item.currentPeriodEnd).getTime() > Date.now();
}

function shortOf(price: number | null) {
  return accountStore.signedIn && accountStore.vpointBalance !== null && price !== null && accountStore.vpointBalance < price;
}

function clearBuy() {
  if (purchaseLoading.value) return;
  pendingBuy.value = null;
}

async function login() {
  loggingIn.value = true;
  const result = await accountStore.login();
  loggingIn.value = false;
  if (result.success) {
    toast.success("登录成功");
    await load({ quiet: true, force: true });
  } else {
    toast.error(result.error || "登录失败");
  }
}

async function setBorrow(allow: boolean) {
  borrowSaving.value = true;
  const result = await accountStore.setQuotaBorrow(allow);
  borrowSaving.value = false;
  if (result.success) toast.success("已保存");
  else toast.error(result.error || "保存失败");
}

async function load(options: { quiet?: boolean; notify?: boolean; force?: boolean } = {}) {
  if (purchaseLoading.value) return;
  if (!options.force && options.quiet && (pending.value || refreshing.value)) return;
  const seq = ++loadSeq;
  if (options.quiet) refreshing.value = true;
  else pending.value = true;
  try {
    if (!accountStore.loaded) await accountStore.refresh();
    if (seq !== loadSeq) return;
    const [planResult, memberPlanResult, paymentsResult] = await Promise.all([
      window.electron.invoke("cloud:billing-plans"),
      window.electron.invoke("cloud:membership-plans"),
      window.electron.invoke("cloud:billing-payments"),
    ]);
    if (seq !== loadSeq) return;
    plans.value = planResult?.success && Array.isArray(planResult.data) ? planResult.data : [];
    membershipPlans.value = memberPlanResult?.success && Array.isArray(memberPlanResult.data) ? memberPlanResult.data : [];
    paymentsOpen.value = paymentsResult?.success ? paymentsResult.data?.enabled === true : null;
    plansError.value = planResult?.success ? "" : planResult?.error || "无法读取方案";
    membershipError.value = memberPlanResult?.success ? "" : memberPlanResult?.error || "无法读取听众会员";

    if (accountStore.signedIn) {
      const [subResult, memberResult, orderResult] = await Promise.all([
        window.electron.invoke("cloud:billing-subscription"),
        window.electron.invoke("cloud:membership"),
        window.electron.invoke("cloud:orders"),
        accountStore.refresh(),
      ]);
      if (seq !== loadSeq) return;
      if (subResult?.success) {
        subscription.value = subResult.data || null;
        subscriptionError.value = "";
      } else {
        subscriptionError.value = subResult?.error || "无法读取当前订阅";
      }
      if (memberResult?.success && Array.isArray(memberResult.data)) memberships.value = memberResult.data;
      if (orderResult?.success && Array.isArray(orderResult.data)) {
        orders.value = orderResult.data;
        ordersError.value = "";
      } else {
        ordersError.value = orderResult?.error || "无法读取订单";
      }
    } else {
      subscription.value = null;
      subscriptionError.value = "";
      memberships.value = [];
      orders.value = [];
      ordersError.value = "";
    }

    if (options.notify) {
      const message = plansError.value || membershipError.value || subscriptionError.value || ordersError.value;
      if (message) toast.error(message);
    }
  } finally {
    if (seq === loadSeq) {
      pending.value = false;
      refreshing.value = false;
    }
  }
}

async function askBuy(kind: PendingBuy["kind"], id: string, name: string, price: number | null) {
  if (loggingIn.value || purchaseLoading.value || !price || price < 1) return;
  if (!accountStore.signedIn) {
    await login();
    if (!accountStore.signedIn) return;
  }
  if (shortOf(price)) return;
  pendingBuy.value = { kind, id, name, price, key: crypto.randomUUID() };
}

async function confirmBuy() {
  const buy = pendingBuy.value;
  if (!buy || purchaseLoading.value) return;
  purchaseLoading.value = true;
  const channel = buy.kind === "plan" ? "cloud:billing-purchase" : "cloud:membership-purchase";
  const payload = buy.kind === "plan" ? { planId: buy.id, idempotencyKey: buy.key } : { listenerPlanId: buy.id, idempotencyKey: buy.key };
  let bought = false;
  try {
    const result = await window.electron.invoke(channel, payload);
    if (!result?.success) {
      toast.error(result?.error || "购买失败");
      return;
    }
    if (typeof result.data?.balance === "number") accountStore.setVpointBalance(result.data.balance);
    pendingBuy.value = null;
    bought = true;
    toast.success("已使用 V豆");
  } finally {
    purchaseLoading.value = false;
  }
  if (bought) await load({ quiet: true });
}

async function openPortal(target: "plan" | "membership") {
  if (paymentsOpen.value !== true || portalTarget.value) return;
  portalTarget.value = target;
  try {
    const result = await window.electron.invoke(target === "plan" ? "cloud:billing-portal" : "cloud:membership-portal");
    const url = result?.data?.url;
    if (!result?.success || typeof url !== "string") {
      toast.error(result?.error || "无法打开管理页面");
      return;
    }
    await openLink(url);
  } finally {
    portalTarget.value = "";
  }
}

async function openLink(url: string) {
  const result = await window.electron.invoke("cloud:open-external", url);
  if (!result?.success) toast.error(result?.error || "无法打开链接");
  else openedExternal.value = true;
}

function onFocus() {
  if (!openedExternal.value || document.visibilityState === "hidden" || purchaseLoading.value || pendingBuy.value) return;
  openedExternal.value = false;
  load({ quiet: true });
}

onMounted(() => {
  load();
  window.addEventListener("focus", onFocus);
});

onUnmounted(() => {
  window.removeEventListener("focus", onFocus);
});
</script>
