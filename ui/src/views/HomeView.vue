<template>
  <div class="mx-auto max-w-6xl px-6 py-6">
    <VPageHeader :title="greeting" description="从这里继续最近的工作，或开始新的配音任务。">
      <template #actions>
        <VButton :icon="ArrowPathIcon" :loading="accountStore.syncing" :disabled="!accountStore.signedIn" @click="syncNow">
          同步
        </VButton>
        <VButton variant="primary" :icon="PlusIcon" @click="formOpen = true">新建读文章</VButton>
      </template>
    </VPageHeader>

    <div class="grid gap-4 lg:grid-cols-3">
      <!-- 账户与额度 -->
      <section class="panel p-4 lg:col-span-1">
        <div class="flex items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            :class="accountStore.signedIn ? 'bg-accent/15 text-accent' : 'bg-soft text-ink-subtle'"
          >
            <UserIcon v-if="!accountStore.signedIn" class="h-5 w-5" aria-hidden="true" />
            <template v-else>{{ accountStore.initials }}</template>
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-ink">{{ accountStore.displayName }}</p>
            <p class="truncate text-xs text-ink-subtle">{{ accountStore.apiBase.replace(/^https?:\/\//, "") }}</p>
          </div>
          <VBadge v-if="accountStore.signedIn" tone="success" dot class="ml-auto">在线</VBadge>
        </div>

        <div v-if="accountStore.signedIn" class="mt-4 space-y-3">
          <VMeter v-if="quota" :value="quota.used" :max="quota.limit" label="本月已用字数" />
          <p v-else class="text-xs text-ink-subtle">暂无订阅额度，可在官网订阅套餐。</p>
          <p v-if="quota?.periodEnd" class="text-2xs text-ink-subtle">
            额度将于 {{ new Date(quota.periodEnd).toLocaleDateString() }} 重置
          </p>
          <p v-if="accountStore.lastSyncedAt" class="text-2xs text-ink-subtle">
            上次同步：{{ formatRelative(accountStore.lastSyncedAt) }}
          </p>
        </div>
        <div v-else class="mt-4 space-y-3">
          <p class="text-sm text-ink-muted">登录官网账号后即可使用云端音色、有声小说分角色与多端同步。</p>
          <VButton variant="primary" block :loading="loggingIn" @click="login">登录官网账号</VButton>
        </div>
      </section>

      <!-- 快捷入口 -->
      <section class="grid grid-cols-2 gap-3 lg:col-span-2">
        <RouterLink
          v-for="entry in entries"
          :key="entry.to"
          :to="entry.to"
          class="panel group flex items-start gap-3 p-4 transition-colors duration-fast hover:border-line-strong hover:bg-raised"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" :class="entry.tone">
            <component :is="entry.icon" class="h-5 w-5" aria-hidden="true" />
          </span>
          <span class="min-w-0">
            <span class="flex items-center gap-1 text-sm font-medium text-ink">
              {{ entry.title }}
              <ArrowRightIcon class="h-3.5 w-3.5 -translate-x-1 text-ink-subtle opacity-0 transition-all duration-fast group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
            </span>
            <span class="mt-0.5 block text-xs text-ink-muted">{{ entry.description }}</span>
          </span>
          <VBadge v-if="entry.badge" :tone="entry.badgeTone" dot :pulse="entry.badgeTone === 'live'" class="ml-auto">
            {{ entry.badge }}
          </VBadge>
        </RouterLink>
      </section>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <section class="panel overflow-hidden">
        <div class="panel-header">
          <FolderIcon class="h-4 w-4 text-ink-subtle" aria-hidden="true" />
          最近的读文章
          <RouterLink to="/projects" class="ml-auto text-xs font-normal text-ink-muted hover:text-accent">全部</RouterLink>
        </div>
        <ul v-if="recentProjects.length">
          <li v-for="project in recentProjects" :key="project.id">
            <RouterLink :to="`/projects/${project.id}`" class="list-row">
              <span class="min-w-0 flex-1 truncate text-sm text-ink">{{ project.title }}</span>
              <span class="num shrink-0 text-2xs text-ink-subtle">{{ formatRelative(project.updateAt) }}</span>
            </RouterLink>
          </li>
        </ul>
        <VEmptyState v-else compact title="还没有读文章" description="新建一篇读文章，粘贴正文即可合成。" />
      </section>

      <section class="panel overflow-hidden">
        <div class="panel-header">
          <BookOpenIcon class="h-4 w-4 text-ink-subtle" aria-hidden="true" />
          最近的有声小说
          <RouterLink to="/read-novels" class="ml-auto text-xs font-normal text-ink-muted hover:text-accent">全部</RouterLink>
        </div>
        <ul v-if="recentNovels.length">
          <li v-for="novel in recentNovels" :key="novel.id">
            <RouterLink :to="{ path: '/read-novels', query: { novel: novel.id } }" class="list-row">
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm text-ink">{{ novel.title }}</span>
                <span class="block truncate text-2xs text-ink-subtle">{{ novel.author || "佚名" }}</span>
              </span>
              <span class="num shrink-0 text-2xs text-ink-subtle">{{ formatRelative(novel.updatedAt) }}</span>
            </RouterLink>
          </li>
        </ul>
        <VEmptyState v-else compact title="还没有有声小说" description="导入章节，用 AI 拆分角色，并为每个角色指定固定音色。" />
      </section>
    </div>

    <ProjectFormModal
      :open="formOpen"
      title="新建读文章"
      submit-text="创建"
      :submitting="creating"
      @close="formOpen = false"
      @submit="createProject"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  FolderIcon,
  PlusIcon,
  SignalIcon,
  UserIcon,
} from "@heroicons/vue/24/outline";
import VPageHeader from "@/components/ui/VPageHeader.vue";
import VButton from "@/components/ui/VButton.vue";
import VBadge from "@/components/ui/VBadge.vue";
import VMeter from "@/components/ui/VMeter.vue";
import VEmptyState from "@/components/ui/VEmptyState.vue";
import ProjectFormModal, { type ProjectFormData } from "@/components/projects/ProjectFormModal.vue";
import { useAccountStore } from "@/stores/account";
import { useProjectsStore } from "@/stores/projects";
import { useNovelsStore } from "@/stores/novels";
import { useBiliLiveStore } from "@/stores/biliLive";
import { formatRelative } from "@/utils/format";

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "live";

const router = useRouter();
const toast = useToast();
const accountStore = useAccountStore();
const projectsStore = useProjectsStore();
const novelsStore = useNovelsStore();
const liveStore = useBiliLiveStore();

const formOpen = ref(false);
const creating = ref(false);
const loggingIn = ref(false);

const greeting = computed(() => {
  const hour = new Date().getHours();
  const period = hour < 6 ? "夜深了" : hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";
  return accountStore.account?.displayName ? `${period}，${accountStore.account.displayName}` : period;
});

const quota = computed(() => {
  const q = accountStore.account?.quota;
  return q && q.limit > 0 ? q : null;
});

const recentProjects = computed(() => projectsStore.projectsSorted.slice(0, 5));
const recentNovels = computed(() =>
  [...novelsStore.novels]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
);

const entries = computed<
  { to: string; title: string; description: string; icon: Component; tone: string; badge?: string; badgeTone?: BadgeTone }[]
>(() => [
  {
    to: "/projects",
    title: "读文章",
    description: "整篇一个音色，粘贴正文后直接合成。",
    icon: FolderIcon,
    tone: "bg-accent/10 text-accent",
    badge: projectsStore.projects.length ? `${projectsStore.projects.length} 个` : undefined,
    badgeTone: "neutral",
  },
  {
    to: "/read-novels",
    title: "有声小说",
    description: "AI 拆分旁白和对白，每个角色使用固定音色。",
    icon: BookOpenIcon,
    tone: "bg-role-4/10 text-role-4",
    badge: novelsStore.novels.length ? `${novelsStore.novels.length} 部` : undefined,
    badgeTone: "neutral",
  },
  {
    to: "/bililive",
    title: "直播助手",
    description: "连接 B 站直播间，自动朗读弹幕与礼物。",
    icon: SignalIcon,
    tone: "bg-live/10 text-live",
    badge: liveStore.isConnected ? "直播中" : undefined,
    badgeTone: "live",
  },
  {
    to: "/settings",
    title: "设置",
    description: "账号、云端服务选择、导出目录与版本更新。",
    icon: Cog6ToothIcon,
    tone: "bg-soft text-ink-muted",
  },
]);

async function login() {
  loggingIn.value = true;
  toast.info("请在浏览器中确认登录");
  const result = await accountStore.login();
  loggingIn.value = false;
  if (result.success) toast.success("登录成功");
  else toast.error(result.error || "登录失败");
}

async function syncNow() {
  const result = await accountStore.sync();
  if (result.success) toast.success("同步完成");
  else toast.error(result.error || "同步失败");
}

async function createProject(data: ProjectFormData) {
  creating.value = true;
  const project = await projectsStore.createProject(data.title, data.description, data.defaultVoiceSettings);
  creating.value = false;
  if (!project) return toast.error("创建读文章失败");
  formOpen.value = false;
  router.push({ path: `/projects/${project.id}`, query: { chapter: "new" } });
}

onMounted(() => {
  projectsStore.loadProjects();
  novelsStore.loadNovels();
  if (!accountStore.loaded) accountStore.refresh();
});
</script>
