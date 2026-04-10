<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { X, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-vue-next';
import { useLanguage } from '../context/language';
import { authService, getFriendlyRequestError } from '../services/api';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'login']);

const { t, language } = useLanguage();
const mode = ref('login');
const isLoading = ref(false);
const errorMessage = ref('');
const fieldErrors = ref({});
const googleMountRef = ref(null);
const googleScriptId = 'google-identity-services';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const canUseGoogleLogin = computed(() => Boolean(googleClientId));
const formData = ref({
  name: '',
  email: '',
  password: ''
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = () => {
  const errors = {};
  const name = formData.value.name.trim();
  const email = formData.value.email.trim();
  const password = formData.value.password;

  if (mode.value === 'register') {
    if (!name) {
      errors.name = 'Ism kiritilishi shart';
    } else if (name.length < 2) {
      errors.name = "Ism kamida 2 ta harfdan iborat bo'lishi kerak";
    } else if (name.length > 50) {
      errors.name = "Ism 50 ta belgidan oshmasligi kerak";
    }
  }

  if (!email) {
    errors.email = 'Email kiritilishi shart';
  } else if (!emailRegex.test(email)) {
    errors.email = "Email formati noto'g'ri";
  }

  if (!password) {
    errors.password = 'Parol kiritilishi shart';
  } else if (mode.value === 'register') {
    if (password.length < 8) {
      errors.password = "Parol kamida 8 ta belgidan iborat bo'lishi kerak";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Parolda kamida 1 ta katta harf bo'lishi kerak";
    } else if (!/[a-z]/.test(password)) {
      errors.password = "Parolda kamida 1 ta kichik harf bo'lishi kerak";
    } else if (!/\d/.test(password)) {
      errors.password = "Parolda kamida 1 ta raqam bo'lishi kerak";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      errors.password = "Parolda kamida 1 ta maxsus belgi bo'lishi kerak";
    }
  }

  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  errorMessage.value = '';
  fieldErrors.value = {};

  if (!validateForm()) {
    return;
  }

  isLoading.value = true;
  try {
    const payload = {
      name: formData.value.name.trim(),
      email: formData.value.email.trim(),
      password: formData.value.password
    };
    const user = mode.value === 'register'
      ? await authService.register(payload)
      : await authService.login(payload);
    emit('login', user);
    formData.value = {
      name: '',
      email: '',
      password: ''
    };
    fieldErrors.value = {};
    emit('close');
  } catch (error) {
    fieldErrors.value = error?.response?.data?.fieldErrors || {};
    errorMessage.value = getFriendlyRequestError(error, language.value);
  } finally {
    isLoading.value = false;
  }
};

const handleGoogleLogin = async (response) => {
  if (!response?.credential) return;
  errorMessage.value = '';
  isLoading.value = true;
  try {
    const user = await authService.loginWithGoogle(response.credential);
    emit('login', user);
    emit('close');
  } catch (error) {
    errorMessage.value = getFriendlyRequestError(error, language.value);
  } finally {
    isLoading.value = false;
  }
};

const renderGoogleButton = async () => {
  if (!props.isOpen || !canUseGoogleLogin.value) return;

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
    text: mode.value === 'login' ? 'signin_with' : 'signup_with',
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

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) ensureGoogleScript();
  },
  { immediate: true }
);

watch(mode, () => {
  errorMessage.value = '';
  fieldErrors.value = {};
  if (props.isOpen) renderGoogleButton();
});

onBeforeUnmount(() => {
  const script = document.getElementById(googleScriptId);
  if (script) {
    script.dataset.loaded = 'true';
  }
});
</script>

<template>
  <div v-if="props.isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />

    <div class="relative w-full max-w-md bg-[#1e293b] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
      <div class="p-6 pb-0 text-center relative">
        <button @click="emit('close')" class="absolute right-6 top-6 text-white/40 hover:text-white transition-colors">
          <X :size="24" />
        </button>
        <h2 class="text-2xl font-bold text-white mb-2">
          {{ mode === 'login' ? t('auth.welcome') : t('auth.join') }}
        </h2>
        <p class="text-white/50 text-sm">
          {{ mode === 'login' ? t('auth.login_desc') : t('auth.join_desc') }}
        </p>
      </div>

      <div class="p-6">
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div v-if="mode === 'register'" class="space-y-1">
            <label class="text-xs font-medium text-white/70 ml-1">{{ t('auth.name') }}</label>
            <div class="relative">
              <User class="absolute left-3 top-3 text-white/30" :size="18" />
              <input
                v-model="formData.name"
                type="text"
                required
                placeholder="John Doe"
                class="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
              />
            </div>
            <p v-if="fieldErrors.name" class="text-xs text-rose-300 ml-1">{{ fieldErrors.name }}</p>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-white/70 ml-1">{{ t('auth.email') }}</label>
            <div class="relative">
              <Mail class="absolute left-3 top-3 text-white/30" :size="18" />
              <input
                v-model="formData.email"
                type="email"
                required
                placeholder="email@example.com"
                class="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
              />
            </div>
            <p v-if="fieldErrors.email" class="text-xs text-rose-300 ml-1">{{ fieldErrors.email }}</p>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-white/70 ml-1">{{ t('auth.password') }}</label>
            <div class="relative">
              <Lock class="absolute left-3 top-3 text-white/30" :size="18" />
              <input
                v-model="formData.password"
                type="password"
                required
                placeholder="********"
                class="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
              />
            </div>
            <p v-if="fieldErrors.password" class="text-xs text-rose-300 ml-1">{{ fieldErrors.password }}</p>
            <p v-if="mode === 'register'" class="text-[11px] text-white/35 ml-1">
              Kamida 8 ta belgi, katta harf, kichik harf, raqam va maxsus belgi.
            </p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            <Loader2 v-if="isLoading" :size="20" class="animate-spin" />
            <template v-else>
              {{ mode === 'login' ? t('login') : t('auth.register') }}
              <ArrowRight :size="18" />
            </template>
          </button>

          <p v-if="isLoading && !errorMessage" class="text-sm text-white/45 text-center">
            {{
              language === 'ru'
                ? 'Проверяем вход...'
                : language === 'en'
                  ? 'Checking sign-in...'
                  : 'Kirish tekshirilmoqda...'
            }}
          </p>
          <p v-if="errorMessage" class="text-sm text-rose-300 text-center">
            {{ errorMessage }}
          </p>
        </form>

        <div v-if="canUseGoogleLogin" class="mt-4">
          <div class="relative flex items-center justify-center text-xs uppercase tracking-[0.24em] text-white/30 mb-4">
            <span class="absolute inset-x-0 h-px bg-white/10"></span>
            <span class="relative px-3 bg-[#1e293b]">yoki</span>
          </div>
          <div class="google-button-frame justify-center w-full">
            <div ref="googleMountRef" class="google-button-shell flex justify-center min-h-[44px]"></div>
          </div>
        </div>

        <div class="mt-6 text-center">
          <p class="text-sm text-white/40">
            {{ mode === 'login' ? t('auth.no_account') : t('auth.has_account') }}
            <button
              @click="mode = mode === 'login' ? 'register' : 'login'"
              class="ml-2 text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              {{ mode === 'login' ? t('auth.register') : t('login') }}
            </button>
          </p>
        </div>
      </div>
    </div>
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
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.18);
}

.google-button-frame:active {
  transform: translateY(0) scale(0.985);
}

.google-button-shell :deep(div),
.google-button-shell :deep(iframe) {
  border-radius: 999px;
}

.google-button-shell :deep(iframe) {
  filter: drop-shadow(0 12px 28px rgba(2, 6, 23, 0.25));
}
</style>

