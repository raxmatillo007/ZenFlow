<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { Sparkles, Brain, Music, ArrowRight, CheckCircle2, Zap, Layout, HelpCircle, Loader2, TimerReset, BarChart3, ListChecks } from 'lucide-vue-next';
import { useLanguage } from '../context/language';
import LanguageSelector from './LanguageSelector.vue';
import LegalModal from './LegalModal.vue';
import { authService, getFriendlyRequestError } from '../services/api';

const emit = defineEmits(['get-started', 'login', 'google-login']);

const { t, language } = useLanguage();
const googleMountRef = ref(null);
const googleScriptId = 'google-identity-services';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const googleError = ref('');
const isGoogleLoading = ref(false);
const canUseGoogleLogin = computed(() => Boolean(googleClientId));
const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@zenflow.app';
const legalSection = ref('privacy');
const isLegalOpen = ref(false);
const currentYear = new Date().getFullYear();

const legalLinks = computed(() => [
  { id: 'privacy', label: language.value === 'ru' ? 'Конфиденциальность' : language.value === 'uz' ? 'Maxfiylik' : 'Privacy' },
  { id: 'terms', label: language.value === 'ru' ? 'Условия' : language.value === 'uz' ? 'Shartlar' : 'Terms' },
  { id: 'refund', label: language.value === 'ru' ? 'Возврат' : language.value === 'uz' ? 'Qaytarish' : 'Refund' },
  { id: 'contact', label: language.value === 'ru' ? 'Контакты' : language.value === 'uz' ? 'Aloqa' : 'Contact' }
]);

const steps = computed(() => [
  { icon: ListChecks, title: t('landing.how.step1'), desc: t('landing.how.step1_desc'), color: 'text-rose-300', bg: 'bg-rose-500/10' },
  { icon: Music, title: t('landing.how.step2'), desc: t('landing.how.step2_desc'), color: 'text-cyan-300', bg: 'bg-cyan-500/10' },
  { icon: TimerReset, title: t('landing.how.step3'), desc: t('landing.how.step3_desc'), color: 'text-emerald-300', bg: 'bg-emerald-500/10' }
]);

const features = computed(() => [
  { icon: Brain, title: t('landing.feature.focus'), desc: t('landing.feature.focus_desc') },
  { icon: Music, title: t('landing.feature.atmos'), desc: t('landing.feature.atmos_desc') },
  { icon: BarChart3, title: t('landing.feature.ai'), desc: t('landing.feature.ai_desc') }
]);

const handleGoogleLogin = async (response) => {
  if (!response?.credential) return;
  googleError.value = '';
  isGoogleLoading.value = true;
  try {
    const user = await authService.loginWithGoogle(response.credential);
    emit('google-login', user);
  } catch (error) {
    googleError.value = getFriendlyRequestError(error, language.value);
  } finally {
    isGoogleLoading.value = false;
  }
};

const renderGoogleButton = async () => {
  if (!canUseGoogleLogin.value) return;
  await nextTick();

  const googleApi = window.google?.accounts?.id;
  const mountEl = googleMountRef.value;
  if (!googleApi || !mountEl) return;

  mountEl.innerHTML = '';
  googleApi.initialize({
    client_id: googleClientId,
    callback: handleGoogleLogin
  });
  googleApi.renderButton(mountEl, {
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    width: 320,
    text: 'signin_with',
    locale: 'en',
    logo_alignment: 'left'
  });
};

const ensureGoogleScript = () => {
  if (!canUseGoogleLogin.value) return;

  if (window.google?.accounts?.id) {
    renderGoogleButton();
    return;
  }

  let script = document.getElementById(googleScriptId);
  if (!script) {
    script = document.createElement('script');
    script.id = googleScriptId;
    script.src = 'https://accounts.google.com/gsi/client?hl=en';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      renderGoogleButton();
    }, { once: true });
    document.head.appendChild(script);
    return;
  }

  if (script.dataset.loaded === 'true') {
    renderGoogleButton();
    return;
  }

  script.addEventListener('load', renderGoogleButton, { once: true });
};

const openLegal = (section) => {
  legalSection.value = section;
  isLegalOpen.value = true;
};

watch(canUseGoogleLogin, () => {
  ensureGoogleScript();
}, { immediate: true });

onBeforeUnmount(() => {
  const script = document.getElementById(googleScriptId);
  if (script) {
    script.dataset.loaded = 'true';
  }
});
</script>

<template>
  <div class="min-h-screen overflow-x-hidden text-white">
    <LegalModal :is-open="isLegalOpen" :section="legalSection" @close="isLegalOpen = false" />

    <div class="fixed inset-0 z-0 pointer-events-none">
      <div class="absolute left-[-8%] top-[-10%] h-[34rem] w-[34rem] rounded-full bg-rose-500/14 blur-[140px] animate-float-slow" />
      <div class="absolute right-[-8%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/12 blur-[120px] animate-float-medium" />
      <div class="absolute bottom-[-12%] left-[18%] h-[24rem] w-[24rem] rounded-full bg-emerald-500/10 blur-[120px] animate-float-fast" />
      <div class="absolute inset-0 surface-grid opacity-[0.07]" />
    </div>

    <nav class="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6">
      <div class="mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border border-white/10 bg-[rgba(7,12,21,0.68)] px-4 py-3 shadow-[0_12px_40px_rgba(2,6,23,0.28)] backdrop-blur-2xl md:px-5">
        <div class="flex items-center gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-orange-400 shadow-lg shadow-rose-500/20">
            <Sparkles :size="20" />
          </div>
          <div>
            <span class="font-display text-lg font-bold">ZenFlow</span>
            <p class="hidden text-xs text-white/40 md:block">{{ t('landing.badge') }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <LanguageSelector />
          <button @click="emit('login')" class="hidden text-sm font-semibold text-white/70 transition-colors hover:text-white md:block">
            {{ t('login') }}
          </button>
          <button @click="emit('get-started')" class="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/18 active:scale-[0.98]">
            {{ t('auth.register') }}
          </button>
        </div>
      </div>
    </nav>

    <main class="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-28 md:px-6 md:pb-24 md:pt-32">
      <section class="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div>
          <div class="badge-chip text-rose-100/90">
            <span class="inline-flex h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_14px_rgba(251,113,133,0.8)]" />
            {{ t('landing.badge') }}
          </div>

          <h1 class="mt-6 max-w-4xl font-display text-4xl font-bold leading-[0.95] tracking-[-0.05em] md:text-6xl lg:text-7xl">
            {{ t('landing.hero_title') }}
            <span class="bg-gradient-to-r from-rose-300 via-orange-300 to-amber-200 bg-clip-text text-transparent">
              {{ ` ${t('landing.hero_subtitle')}` }}
            </span>
          </h1>

          <p class="mt-6 max-w-2xl text-base leading-7 text-white/60 md:text-lg">
            {{ t('landing.desc') }}
          </p>

          <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button @click="emit('get-started')" class="inline-flex items-center justify-center gap-2 rounded-[1.4rem] bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-4 text-base font-bold text-white shadow-xl shadow-rose-500/25 transition-transform hover:scale-[1.01] active:scale-[0.98]">
              {{ t('start') }}
              <ArrowRight :size="20" />
            </button>

            <div v-if="canUseGoogleLogin" class="google-button-frame">
              <div ref="googleMountRef" class="google-button-shell flex min-h-[44px] justify-center"></div>
            </div>
            <button
              v-else
              type="button"
              class="flex items-center justify-center gap-3 rounded-full border border-white/20 bg-white px-6 py-3 font-semibold text-slate-900 opacity-80 cursor-not-allowed shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
              disabled
            >
              <span class="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-base font-bold text-[#4285F4]">G</span>
              <span>Sign in with Google</span>
            </button>
          </div>

          <div
            v-if="isGoogleLoading"
            class="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60"
          >
            <Loader2 :size="14" class="animate-spin" />
            <span>
              {{
                language === 'ru'
                  ? 'Проверяем вход через Google...'
                  : language === 'uz'
                    ? 'Google kirish tekshirilmoqda...'
                    : 'Checking Google sign-in...'
              }}
            </span>
          </div>
          <p v-else-if="googleError" class="mt-3 text-sm text-rose-300">{{ googleError }}</p>

          <div class="mt-10 grid gap-3 sm:grid-cols-3">
            <div v-for="feature in features" :key="feature.title" class="rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-4">
              <div class="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-white/6 text-white/80">
                <component :is="feature.icon" :size="18" />
              </div>
              <h3 class="text-base font-semibold text-white">{{ feature.title }}</h3>
              <p class="mt-2 text-sm leading-6 text-white/50">{{ feature.desc }}</p>
            </div>
          </div>
        </div>

        <div class="relative">
          <div class="glass-panel rounded-[2rem] p-5 md:p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">ZenFlow Workspace</p>
                <h3 class="mt-2 font-display text-2xl font-bold">A calmer daily system</h3>
              </div>
              <div class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                Live layout
              </div>
            </div>

            <div class="mt-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div class="rounded-[1.6rem] border border-white/8 bg-black/25 p-4">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold text-white/75">{{ t('timer.focus') }}</p>
                  <span class="rounded-full bg-rose-500/12 px-2 py-1 text-[11px] font-semibold text-rose-100">25 {{ t('timer.minutes') }}</span>
                </div>
                <div class="mt-5 flex items-center justify-center">
                  <div class="grid h-48 w-48 place-items-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_65%)]">
                    <div class="text-center">
                      <div class="font-display text-5xl font-bold tracking-[-0.08em]">24:18</div>
                      <p class="mt-2 text-xs uppercase tracking-[0.3em] text-rose-200/80">{{ t('timer.running') }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div class="rounded-[1.6rem] border border-white/8 bg-black/25 p-4">
                  <p class="text-xs uppercase tracking-[0.24em] text-white/35">{{ t('tasks.title') }}</p>
                  <div class="mt-4 space-y-3">
                    <div class="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm text-white/80">Landing revamp</div>
                    <div class="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm text-white/80">Deep work block</div>
                    <div class="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm text-white/80">Review progress</div>
                  </div>
                </div>

                <div class="rounded-[1.6rem] border border-white/8 bg-black/25 p-4">
                  <p class="text-xs uppercase tracking-[0.24em] text-white/35">{{ t('stats.weekly') }}</p>
                  <div class="mt-4 grid grid-cols-7 items-end gap-2">
                    <div v-for="height in [28, 44, 52, 38, 64, 78, 58]" :key="height" class="rounded-t-xl bg-gradient-to-t from-cyan-400 to-emerald-300" :style="{ height: `${height}px` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-16 rounded-[2.25rem] border border-white/8 bg-white/[0.03] px-5 py-8 md:px-8 md:py-10">
        <h2 class="font-display text-3xl font-bold text-center">{{ t('landing.how.title') }}</h2>
        <div class="mt-8 grid gap-4 md:grid-cols-3">
          <div v-for="step in steps" :key="step.title" class="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
            <div :class="`grid h-14 w-14 place-items-center rounded-2xl ${step.bg} ${step.color}`">
              <component :is="step.icon" :size="24" />
            </div>
            <h3 class="mt-5 text-xl font-semibold text-white">{{ step.title }}</h3>
            <p class="mt-3 text-sm leading-6 text-white/55">{{ step.desc }}</p>
          </div>
        </div>
      </section>

      <section class="mt-16 grid gap-6 lg:grid-cols-2">
        <div class="glass-panel rounded-[2rem] p-6">
          <h2 class="font-display text-3xl font-bold">{{ t('landing.pricing.title') }}</h2>
          <p class="mt-3 max-w-xl text-white/55">
            {{ language === 'ru' ? 'Начните бесплатно и расширяйте систему по мере роста ритма.' : language === 'uz' ? 'Bepul boshlang va fokus ritmingiz kuchaygan sari kengaytiring.' : 'Start free and expand as your focus rhythm grows.' }}
          </p>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <div class="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
              <p class="text-sm font-semibold text-white/70">{{ t('landing.pricing.free') }}</p>
              <p class="mt-2 text-4xl font-display font-bold">$0</p>
              <div class="mt-5 space-y-3 text-sm text-white/65">
                <div class="flex items-center gap-2"><CheckCircle2 :size="16" class="text-white/30" /> {{ t('landing.pricing.feature.sounds') }}</div>
                <div class="flex items-center gap-2"><CheckCircle2 :size="16" class="text-white/30" /> {{ t('landing.pricing.feature.stats') }}</div>
                <div class="flex items-center gap-2"><CheckCircle2 :size="16" class="text-white/30" /> {{ t('landing.pricing.feature.ai') }}</div>
                <div class="flex items-center gap-2"><CheckCircle2 :size="16" class="text-white/30" /> {{ t('landing.pricing.feature.theme') }}</div>
              </div>
              <button @click="emit('get-started')" class="mt-6 w-full rounded-xl border border-white/10 bg-white/10 py-3 font-semibold text-white transition-colors hover:bg-white/16">
                {{ t('start') }}
              </button>
            </div>

            <div class="rounded-[1.6rem] border border-rose-400/20 bg-gradient-to-b from-rose-500/12 to-orange-500/8 p-5">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-white">{{ t('landing.pricing.pro') }}</p>
                <span class="rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white">POPULAR</span>
              </div>
              <p class="mt-2 text-4xl font-display font-bold">{{ t('premium.price') }}</p>
              <p class="mt-2 text-sm text-rose-100/80">{{ t('premium.discount') }}</p>
              <div class="mt-5 space-y-3 text-sm text-white/80">
                <div class="flex items-center gap-2"><CheckCircle2 :size="16" class="text-rose-300" /> {{ t('landing.pricing.feature.sounds_pro') }}</div>
                <div class="flex items-center gap-2"><CheckCircle2 :size="16" class="text-rose-300" /> {{ t('landing.pricing.feature.stats_pro') }}</div>
                <div class="flex items-center gap-2"><CheckCircle2 :size="16" class="text-rose-300" /> {{ t('landing.pricing.feature.ai_pro') }}</div>
                <div class="flex items-center gap-2"><CheckCircle2 :size="16" class="text-rose-300" /> {{ t('landing.pricing.feature.theme_pro') }}</div>
              </div>
              <button @click="emit('get-started')" class="mt-6 w-full rounded-xl bg-white py-3 font-bold text-slate-950 transition-transform hover:scale-[1.01]">
                {{ t('premium.go') }}
              </button>
            </div>
          </div>
        </div>

        <div class="glass-panel rounded-[2rem] p-6">
          <h2 class="font-display text-3xl font-bold">{{ t('landing.faq.title') }}</h2>
          <div class="mt-6 space-y-4">
            <div class="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
              <h4 class="flex items-center gap-2 text-lg font-semibold"><HelpCircle :size="18" class="text-white/40" /> {{ t('landing.faq.q1') }}</h4>
              <p class="mt-3 text-sm leading-6 text-white/55">{{ t('landing.faq.a1') }}</p>
            </div>
            <div class="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
              <h4 class="flex items-center gap-2 text-lg font-semibold"><Layout :size="18" class="text-white/40" /> {{ t('landing.faq.q2') }}</h4>
              <p class="mt-3 text-sm leading-6 text-white/55">{{ t('landing.faq.a2') }}</p>
            </div>
            <div class="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
              <h4 class="flex items-center gap-2 text-lg font-semibold"><Zap :size="18" class="text-white/40" /> {{ t('landing.footer') }}</h4>
              <p class="mt-3 text-sm leading-6 text-white/55">{{ supportEmail }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="relative z-10 border-t border-white/6 bg-black/30 px-4 py-10 md:px-6">
      <div class="mx-auto max-w-7xl">
        <p class="text-sm uppercase tracking-[0.24em] text-white/30">{{ t('landing.footer') }}</p>
        <div class="mt-5 flex flex-wrap gap-3">
          <button
            v-for="link in legalLinks"
            :key="link.id"
            @click="openLegal(link.id)"
            class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {{ link.label }}
          </button>
        </div>
        <p class="mt-6 text-sm text-white/35">© {{ currentYear }} ZenFlow. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.google-button-frame {
  display: inline-flex;
  border-radius: 999px;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.google-button-frame:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.18);
}

.google-button-shell :deep(div),
.google-button-shell :deep(iframe) {
  border-radius: 999px;
}

.google-button-shell :deep(iframe) {
  filter: drop-shadow(0 12px 24px rgba(2, 6, 23, 0.18));
}
</style>
