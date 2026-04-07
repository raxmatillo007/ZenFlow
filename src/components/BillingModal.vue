<script setup>
import { computed, ref, watch } from 'vue';
import { X, CreditCard, Wallet, BadgeDollarSign, CheckCircle2, LoaderCircle } from 'lucide-vue-next';
import { useLanguage } from '../context/language';
import { billingService, getFriendlyRequestError } from '../services/api';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'upgraded']);

const { t, language } = useLanguage();

const selectedPlan = ref('monthly');
const selectedMethod = ref('card');
const statusMessage = ref('');
const statusKind = ref('neutral');
const isSubmitting = ref(false);
const configuredProviders = ref({
  card: false,
  uzcard: false
});
const isLoadingProviders = ref(false);

const plans = computed(() => [
  {
    id: 'monthly',
    title: language.value === 'ru' ? 'PRO РњРµСЃСЏС†' : language.value === 'en' ? 'PRO Monthly' : 'PRO Oylik',
    price: '$4.99'
  },
  {
    id: 'yearly',
    title: language.value === 'ru' ? 'PRO Р“РѕРґ' : language.value === 'en' ? 'PRO Yearly' : 'PRO Yillik',
    price: '$39.99'
  },
  {
    id: 'lifetime',
    title: language.value === 'ru' ? 'PRO РќР°РІСЃРµРіРґР°' : language.value === 'en' ? 'PRO Lifetime' : 'PRO Umrbod',
    price: '$89.99'
  }
]);

const methods = computed(() => [
  {
    id: 'card',
    icon: CreditCard,
    title: 'Visa / Mastercard',
    desc: language.value === 'ru' ? 'РњРµР¶РґСѓРЅР°СЂРѕРґРЅС‹Рµ РєР°СЂС‚С‹' : language.value === 'en' ? 'International cards' : 'Xalqaro kartalar'
  },
  {
    id: 'uzcard',
    icon: Wallet,
    title: 'Uzcard / Humo',
    desc: language.value === 'ru' ? 'Р›РѕРєР°Р»СЊРЅР°СЏ РѕРїР»Р°С‚Р°' : language.value === 'en' ? 'Local payment' : 'Mahalliy toвЂlov'
  }
]);

const statusClasses = computed(() => {
  if (statusKind.value === 'success') return 'border-emerald-400/25 bg-emerald-500/10';
  if (statusKind.value === 'error') return 'border-rose-400/25 bg-rose-500/10';
  return 'border-orange-400/25 bg-orange-500/10';
});

const statusIconClasses = computed(() => {
  if (statusKind.value === 'success') return 'bg-emerald-400/15 text-emerald-300';
  if (statusKind.value === 'error') return 'bg-rose-400/15 text-rose-300';
  return 'bg-orange-400/15 text-orange-300';
});

const normalizeMethodCode = (methodCode) => (methodCode === 'uzcard' ? 'uzcard' : 'card');

const isSelectedMethodConfigured = computed(() => configuredProviders.value[normalizeMethodCode(selectedMethod.value)] === true);

const defaultGatewayTitle = computed(() => {
  if (isSelectedMethodConfigured.value) {
    return language.value === 'ru'
      ? 'Платёжный шлюз готов'
      : language.value === 'en'
        ? 'Payment gateway is ready'
        : "To'lov gateway tayyor";
  }

  return language.value === 'ru'
    ? 'Платёжный шлюз ещё не подключён'
    : language.value === 'en'
      ? 'Payment gateway is not connected yet'
      : "To'lov gateway hali ulanmagan";
});

const defaultGatewayMessage = computed(() => {
  if (isLoadingProviders.value) {
    return language.value === 'ru'
      ? 'Проверяем доступные способы оплаты...'
      : language.value === 'en'
        ? 'Checking available payment methods...'
        : "To'lov usullari tekshirilmoqda...";
  }

  if (isSelectedMethodConfigured.value) {
    return language.value === 'ru'
      ? 'Stripe checkout готов. Можно безопасно перейти к оплате.'
      : language.value === 'en'
        ? 'Stripe checkout is ready. You can safely continue to payment.'
        : "Stripe checkout tayyor. To'lovga xavfsiz o'tishingiz mumkin.";
  }

  return language.value === 'ru'
    ? 'Следующий шаг: Stripe для Visa/Mastercard и Click/Payme для Uzcard/Humo.'
    : language.value === 'en'
      ? 'Next step: Stripe for Visa/Mastercard and Click/Payme for Uzcard/Humo.'
      : "Keyingi qadam: Visa/Mastercard uchun Stripe, Uzcard/Humo uchun Click/Payme ulash.";
});

const loadBillingProviders = async () => {
  if (!props.isOpen) return;

  isLoadingProviders.value = true;
  try {
    const response = await billingService.getPlans();
    const providers = Array.isArray(response?.providers) ? response.providers : [];
    configuredProviders.value = {
      card: providers.some((provider) => provider.code === 'card' && provider.configured),
      uzcard: providers.some((provider) => provider.code === 'uzcard' && provider.configured)
    };
  } catch {
    configuredProviders.value = {
      card: false,
      uzcard: false
    };
  } finally {
    isLoadingProviders.value = false;
  }
};

const handleCheckout = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  statusKind.value = 'neutral';
  statusMessage.value =
    language.value === 'ru'
      ? 'Подготавливаем оплату...'
      : language.value === 'en'
        ? 'Preparing checkout...'
        : "To'lov sahifasi tayyorlanmoqda...";

  try {
    const response = await billingService.createCheckout({
      planCode: selectedPlan.value,
      methodCode: normalizeMethodCode(selectedMethod.value)
    });

    if (response?.checkoutUrl) {
      window.location.href = response.checkoutUrl;
      return;
    }

    if (response?.configured === false || response?.mode === 'mock') {
      statusMessage.value =
        language.value === 'ru'
          ? 'РџР»Р°С‚С‘Р¶РЅС‹Р№ С€Р»СЋР· РїРѕРєР° РЅРµ РїРѕРґРєР»СЋС‡С‘РЅ.'
          : language.value === 'en'
            ? 'Payment gateway is not connected yet.'
            : "To'lov gateway hali ulanmagan.";
      statusKind.value = 'neutral';
      return;
    }
  } catch (error) {
    statusMessage.value = getFriendlyRequestError(error, language.value);
    statusKind.value = 'error';
  } finally {
    isSubmitting.value = false;
  }
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) return;
    statusMessage.value = '';
    statusKind.value = 'neutral';
    loadBillingProviders();
  },
  { immediate: true }
);

</script>

<template>
  <div v-if="props.isOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />

    <div class="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#182235] shadow-2xl overflow-hidden">
      <div class="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div>
          <h2 class="text-2xl font-bold text-white">
            {{ language === 'ru' ? 'РћРїР»Р°С‚Р° Premium' : language === 'en' ? 'Premium Checkout' : 'Premium toвЂlov' }}
          </h2>
          <p class="text-sm text-white/50 mt-1">
            {{ language === 'ru' ? 'Р’С‹Р±РµСЂРёС‚Рµ С‚Р°СЂРёС„ Рё СЃРїРѕСЃРѕР± РѕРїР»Р°С‚С‹' : language === 'en' ? 'Choose a plan and payment method' : 'Tarif va toвЂlov usulini tanlang' }}
          </p>
        </div>
        <button @click="emit('close')" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center justify-center">
          <X :size="20" />
        </button>
      </div>

      <div class="p-6 space-y-6">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-white/40 mb-3">
            {{ language === 'ru' ? 'РўР°СЂРёС„' : language === 'en' ? 'Plan' : 'Tarif' }}
          </p>
          <div class="grid md:grid-cols-3 gap-3">
            <button
              v-for="plan in plans"
              :key="plan.id"
              @click="selectedPlan = plan.id"
              :class="[
                'rounded-2xl border p-4 text-left transition-all',
                selectedPlan === plan.id
                  ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              ]"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="text-white font-semibold">{{ plan.title }}</div>
                  <div class="text-white/50 text-sm mt-1">{{ plan.price }}</div>
                </div>
                <CheckCircle2 v-if="selectedPlan === plan.id" class="text-amber-300" :size="18" />
              </div>
            </button>
          </div>
        </div>

        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-white/40 mb-3">
            {{ language === 'ru' ? 'РЎРїРѕСЃРѕР± РѕРїР»Р°С‚С‹' : language === 'en' ? 'Payment method' : 'ToвЂlov usuli' }}
          </p>
          <div class="grid md:grid-cols-2 gap-3">
            <button
              v-for="method in methods"
              :key="method.id"
              @click="selectedMethod = method.id"
              :class="[
                'rounded-2xl border p-4 text-left transition-all',
                selectedMethod === method.id
                  ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              ]"
            >
              <div class="flex items-start gap-3">
                <div class="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <component :is="method.icon" :size="20" />
                </div>
                <div>
                  <div class="text-white font-semibold">{{ method.title }}</div>
                  <div class="text-white/50 text-sm mt-1">{{ method.desc }}</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div :class="['rounded-2xl border p-4', statusClasses]">
          <div class="flex items-start gap-3">
            <div :class="['w-10 h-10 rounded-xl flex items-center justify-center', statusIconClasses]">
              <BadgeDollarSign :size="20" />
            </div>
            <div>
              <p class="text-white font-semibold">
                {{
                  statusMessage
                    ? (language === 'ru' ? 'РЎС‚Р°С‚СѓСЃ РѕРїР»Р°С‚С‹' : language === 'en' ? 'Payment status' : "To'lov holati")
                    : defaultGatewayTitle
                }}
              </p>
              <p class="text-sm text-white/60 mt-1">
                {{
                  statusMessage || defaultGatewayMessage
                }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="handleCheckout"
            :disabled="isSubmitting"
            class="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <LoaderCircle v-if="isSubmitting" class="animate-spin" :size="18" />
            <span v-if="isSubmitting">
              {{ language === 'ru' ? 'Р—Р°РіСЂСѓР·РєР°...' : language === 'en' ? 'Loading...' : 'Yuklanmoqda...' }}
            </span>
            <span v-else>
              {{ language === 'ru' ? 'РћРїР»Р°С‚РёС‚СЊ' : language === 'en' ? 'Checkout' : "To'lash" }}
            </span>
          </button>
          <button
            @click="emit('close')"
            class="sm:w-40 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all"
          >
            {{ t('close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

