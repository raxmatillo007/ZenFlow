<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { Sparkles, Brain, Music, ArrowRight, CheckCircle2, Zap, Layout, HelpCircle } from 'lucide-vue-next';
import { useLanguage } from '../context/language';
import LanguageSelector from './LanguageSelector.vue';
import LegalModal from './LegalModal.vue';
import { authService } from '../services/api';

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
  { id: 'privacy', label: language.value === 'ru' ? 'Конфиденциальность' : language.value === 'en' ? 'Privacy' : 'Maxfiylik' },
  { id: 'terms', label: language.value === 'ru' ? 'Условия' : language.value === 'en' ? 'Terms' : 'Shartlar' },
  { id: 'refund', label: language.value === 'ru' ? 'Возврат' : language.value === 'en' ? 'Refund' : 'Refund' },
  { id: 'contact', label: language.value === 'ru' ? 'Контакты' : language.value === 'en' ? 'Contact' : 'Aloqa' }
]);

const steps = [
  { icon: Brain, title: t('landing.how.step1'), desc: t('landing.how.step1_desc'), color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { icon: Music, title: t('landing.how.step2'), desc: t('landing.how.step2_desc'), color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { icon: Zap, title: t('landing.how.step3'), desc: t('landing.how.step3_desc'), color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

const handleGoogleLogin = async (response) => {
  if (!response?.credential) return;
  googleError.value = '';
  isGoogleLoading.value = true;
  try {
    const user = await authService.loginWithGoogle(response.credential);
    emit('google-login', user);
  } catch (error) {
    googleError.value = error?.response?.data?.message || error?.message || 'Google kirishda xatolik yuz berdi';
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
    width: 300,
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
  <div class="min-h-screen bg-[#0f172a] text-white overflow-x-hidden font-sans">
    <LegalModal :is-open="isLegalOpen" :section="legalSection" @close="isLegalOpen = false" />
    <div class="fixed inset-0 z-0 pointer-events-none">
      <div class="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-rose-600/20 blur-[120px] animate-float-slow" />
      <div class="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-float-medium" />
      <div class="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/noise.png')]" />
    </div>

    <nav class="fixed inset-x-0 top-0 z-50">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-md shadow-[0_12px_40px_rgba(15,23,42,0.14)]">
          <div class="flex items-center gap-2">
          <div class="w-10 h-10 bg-gradient-to-br from-rose-400 to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Sparkles class="text-white" :size="20" />
          </div>
          <span class="text-xl font-bold tracking-tight hidden sm:inline">{{ t('app.name') }}</span>
        </div>

          <div class="flex items-center gap-3 md:gap-4">
            <LanguageSelector />
            <div class="h-6 w-[1px] bg-white/10 hidden md:block" />
            <button @click="emit('login')" class="text-white/70 hover:text-white font-medium text-sm transition-colors hidden md:block">
              {{ t('login') }}
            </button>
            <button @click="emit('get-started')" class="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap">
              {{ t('auth.register') }}
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="relative z-10 container mx-auto px-6 pt-24 pb-20 md:pt-28 md:pb-32 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        ZenFlow Focus Workspace
      </div>

      <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 md:mb-10 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
        {{ t('landing.hero_title') }}
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400">
          {{ ` ${t('landing.hero_subtitle')}` }}
        </span>
      </h1>

      <p class="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-14 md:mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        {{ t('landing.desc') }}
      </p>

      <div class="flex flex-col items-center justify-center gap-7 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
        <button @click="emit('get-started')" class="w-full max-w-[300px] px-8 py-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white text-base md:text-lg font-bold rounded-[22px] shadow-xl shadow-rose-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
          {{ t('start') }}
          <ArrowRight :size="22" />
        </button>
      </div>

        <div class="mt-10 md:mt-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-400">
          <div v-if="canUseGoogleLogin" class="google-button-frame">
            <div ref="googleMountRef" class="google-button-shell flex justify-center min-h-[44px]"></div>
          </div>
          <button
            v-else
            type="button"
            class="flex items-center justify-center gap-3 rounded-full border border-white/20 bg-white px-6 py-3 text-slate-900 font-semibold opacity-80 cursor-not-allowed shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
            disabled
          >
            <span class="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-base font-bold text-[#4285F4]">G</span>
            <span>Sign in with Google</span>
          </button>
          <p v-if="googleError" class="mt-3 text-sm text-rose-300">{{ googleError }}</p>
          <p v-else-if="isGoogleLoading" class="mt-3 text-xs text-white/45">
            Google kirish tekshirilmoqda...
          </p>
        </div>
    </div>

    <div class="relative z-10 container mx-auto px-6 py-20 border-t border-white/5">
      <h2 class="text-3xl font-bold text-center mb-16">{{ t('landing.how.title') }}</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div v-for="(step, i) in steps" :key="i" class="flex flex-col items-center text-center p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
          <div :class="`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${step.bg} ${step.color}`">
            <component :is="step.icon" :size="32" />
          </div>
          <h3 class="text-xl font-bold mb-2">{{ step.title }}</h3>
          <p class="text-white/50">{{ step.desc }}</p>
        </div>
      </div>
    </div>

    <div class="relative z-10 container mx-auto px-6 py-20 border-t border-white/5 bg-black/20">
      <h2 class="text-3xl font-bold text-center mb-4">{{ t('landing.pricing.title') }}</h2>
      <p class="text-white/40 text-center mb-16 max-w-xl mx-auto">
        {{ language === 'ru' ? 'Запускайтесь бесплатно, масштабируйтесь на PRO.' : language === 'en' ? 'Start free, scale with PRO.' : 'Bepul boshlang, PRO bilan kengaying.' }}
      </p>

      <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div class="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col">
          <h3 class="text-xl font-bold text-white mb-2">{{ t('landing.pricing.free') }}</h3>
          <div class="text-4xl font-bold text-white mb-6">$0</div>
          <ul class="space-y-4 mb-8 flex-1">
            <li class="flex items-center gap-3 text-white/70"><CheckCircle2 :size="18" class="text-white/30" /> {{ t('landing.pricing.feature.sounds') }}</li>
            <li class="flex items-center gap-3 text-white/70"><CheckCircle2 :size="18" class="text-white/30" /> {{ t('landing.pricing.feature.stats') }}</li>
            <li class="flex items-center gap-3 text-white/70"><CheckCircle2 :size="18" class="text-white/30" /> {{ t('landing.pricing.feature.ai') }}</li>
            <li class="flex items-center gap-3 text-white/70"><CheckCircle2 :size="18" class="text-white/30" /> {{ t('landing.pricing.feature.theme') }}</li>
          </ul>
          <button @click="emit('get-started')" class="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all">
            {{ t('start') }}
          </button>
        </div>

        <div class="p-8 rounded-3xl bg-gradient-to-b from-rose-900/40 to-black/40 border border-rose-500/30 flex flex-col relative overflow-hidden">
          <div class="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
          <h3 class="text-xl font-bold text-white mb-2">{{ t('landing.pricing.pro') }}</h3>
          <div class="flex items-baseline gap-1 mb-6">
            <span class="text-4xl font-bold text-white">$4.99</span>
            <span class="text-sm text-white/50">/ {{ t('landing.pricing.month') }}</span>
          </div>
          <ul class="space-y-4 mb-8 flex-1">
            <li class="flex items-center gap-3 text-white"><CheckCircle2 :size="18" class="text-rose-400" /> {{ t('landing.pricing.feature.sounds_pro') }}</li>
            <li class="flex items-center gap-3 text-white"><CheckCircle2 :size="18" class="text-rose-400" /> {{ t('landing.pricing.feature.stats_pro') }}</li>
            <li class="flex items-center gap-3 text-white"><CheckCircle2 :size="18" class="text-rose-400" /> {{ t('landing.pricing.feature.ai_pro') }}</li>
            <li class="flex items-center gap-3 text-white"><CheckCircle2 :size="18" class="text-rose-400" /> {{ t('landing.pricing.feature.theme_pro') }}</li>
          </ul>
          <button @click="emit('get-started')" class="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold shadow-lg shadow-rose-500/25 hover:scale-105 transition-all">
            {{ t('premium.go') }}
          </button>
        </div>
      </div>
    </div>

    <div class="relative z-10 container mx-auto px-6 py-20 border-t border-white/5">
      <h2 class="text-3xl font-bold text-center mb-16">{{ t('landing.faq.title') }}</h2>
      <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div class="p-6 rounded-2xl bg-white/5">
          <h4 class="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle :size="18" class="text-white/40" /> {{ t('landing.faq.q1') }}</h4>
          <p class="text-white/60 text-sm leading-relaxed">{{ t('landing.faq.a1') }}</p>
        </div>
        <div class="p-6 rounded-2xl bg-white/5">
          <h4 class="font-bold text-lg mb-2 flex items-center gap-2"><Layout :size="18" class="text-white/40" /> {{ t('landing.faq.q2') }}</h4>
          <p class="text-white/60 text-sm leading-relaxed">{{ t('landing.faq.a2') }}</p>
        </div>
      </div>
    </div>

    <div class="border-t border-white/5 bg-black/40 py-12">
      <div class="container mx-auto px-6 text-center">
        <p class="text-white/40 text-sm mb-6 uppercase tracking-wider">{{ t('landing.footer') }}</p>
        <div class="flex flex-wrap justify-center gap-3 md:gap-4 mb-8">
          <button
            v-for="link in legalLinks"
            :key="link.id"
            @click="openLegal(link.id)"
            class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm transition-all"
          >
            {{ link.label }}
          </button>
        </div>
        <p class="text-white/30 text-sm">{{ supportEmail }}</p>
        <p class="mt-8 text-white/20 text-xs">� {{ currentYear }} ZenFlow. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.google-button-frame {
  display: inline-flex;
  border-radius: 999px;
  transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
}

.google-button-frame:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.18);
}

.google-button-frame:active {
  transform: translateY(0) scale(0.985);
}

.google-button-shell :deep(div),
.google-button-shell :deep(iframe) {
  border-radius: 999px;
}

.google-button-shell :deep(iframe) {
  filter: drop-shadow(0 12px 24px rgba(2, 6, 23, 0.18));
}
</style>


