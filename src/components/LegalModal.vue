<script setup>
import { computed } from 'vue';
import { X, ShieldCheck, ScrollText, RotateCcw, Mail } from 'lucide-vue-next';
import { useLanguage } from '../context/language';

const props = defineProps({
  isOpen: Boolean,
  section: {
    type: String,
    default: 'privacy'
  }
});

const emit = defineEmits(['close']);
const { language } = useLanguage();
const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@zenflow.app';

const sections = computed(() => {
  const isRu = language.value === 'ru';
  const isEn = language.value === 'en';

  return {
    privacy: {
      icon: ShieldCheck,
      title: isRu ? 'Политика конфиденциальности' : isEn ? 'Privacy Policy' : 'Maxfiylik siyosati',
      body: [
        isRu
          ? 'Мы храним только данные, необходимые для работы аккаунта, задач, настроек, статистики и подписки.'
          : isEn
            ? 'We store only the data required to run your account, tasks, settings, statistics, and subscription.'
            : 'Biz faqat akkaunt, vazifalar, sozlamalar, statistika va obuna ishlashi uchun kerak bo‘lgan ma’lumotlarni saqlaymiz.',
        isRu
          ? 'Платёжные данные обрабатываются сторонними провайдерами и не сохраняются в полном виде на серверах ZenFlow.'
          : isEn
            ? 'Payment data is processed by third-party providers and is not stored in full on ZenFlow servers.'
            : 'To‘lov ma’lumotlari uchinchi tomon provayderlari tomonidan qayta ishlanadi va ZenFlow serverlarida to‘liq saqlanmaydi.',
        isRu
          ? 'По вопросам удаления данных обращайтесь в поддержку.'
          : isEn
            ? 'Contact support if you need your account data removed.'
            : 'Ma’lumotlarni o‘chirish uchun support bilan bog‘laning.'
      ]
    },
    terms: {
      icon: ScrollText,
      title: isRu ? 'Условия использования' : isEn ? 'Terms of Service' : 'Foydalanish shartlari',
      body: [
        isRu
          ? 'Используя ZenFlow, вы соглашаетесь применять сервис законно и не злоупотреблять доступом, аккаунтами или инфраструктурой.'
          : isEn
            ? 'By using ZenFlow, you agree to use the service lawfully and not abuse access, accounts, or infrastructure.'
            : 'ZenFlow’dan foydalanganingizda, servisdan qonuniy foydalanish va tizimga zarar yetkazmaslikka rozilik bildirasiz.',
        isRu
          ? 'Платные функции активируются после подтверждённой оплаты и могут быть ограничены при нарушении правил.'
          : isEn
            ? 'Paid features activate after confirmed payment and may be restricted if the rules are violated.'
            : 'Pullik funksiyalar tasdiqlangan to‘lovdan keyin yoqiladi va qoidabuzarlikda cheklanishi mumkin.',
        isRu
          ? 'Мы можем обновлять условия по мере развития продукта.'
          : isEn
            ? 'We may update these terms as the product evolves.'
            : 'Mahsulot rivojlanishi bilan ushbu shartlar yangilanib borishi mumkin.'
      ]
    },
    refund: {
      icon: RotateCcw,
      title: isRu ? 'Политика возврата' : isEn ? 'Refund Policy' : 'Qaytarish siyosati',
      body: [
        isRu
          ? 'Ежемесячные и годовые подписки можно отменить до следующего списания.'
          : isEn
            ? 'Monthly and yearly subscriptions can be canceled before the next billing cycle.'
            : 'Oylik va yillik obunalarni keyingi billing davrigacha bekor qilish mumkin.',
        isRu
          ? 'Возвраты рассматриваются индивидуально при технических ошибках, дублирующих списаниях или недоступности сервиса.'
          : isEn
            ? 'Refunds are reviewed case by case for technical failures, duplicate charges, or service unavailability.'
            : 'Texnik xatolik, dubl to‘lov yoki servis ishlamagan holatlarda refund alohida ko‘rib chiqiladi.',
        isRu
          ? `Для запроса возврата напишите на ${supportEmail}.`
          : isEn
            ? `To request a refund, email ${supportEmail}.`
            : `Refund so‘rovi uchun ${supportEmail} manziliga yozing.`
      ]
    },
    contact: {
      icon: Mail,
      title: isRu ? 'Контакты и поддержка' : isEn ? 'Contact & Support' : 'Aloqa va support',
      body: [
        isRu
          ? `Основная почта поддержки: ${supportEmail}`
          : isEn
            ? `Primary support email: ${supportEmail}`
            : `Asosiy support email: ${supportEmail}`,
        isRu
          ? 'Для вопросов по оплате, удалению данных или доступу к аккаунту используйте тот же email.'
          : isEn
            ? 'Use the same email for billing, data removal, or account access questions.'
            : 'To‘lov, data o‘chirish yoki akkaunt kirishi bilan bog‘liq savollar uchun shu emaildan foydalaning.',
        isRu
          ? 'Ответ по рабочим обращениям обычно приходит в течение 1–3 рабочих дней.'
          : isEn
            ? 'Business support requests are usually answered within 1–3 business days.'
            : 'Ishchi support so‘rovlarga odatda 1–3 ish kunida javob beriladi.'
      ]
    }
  };
});

const active = computed(() => sections.value[props.section] || sections.value.privacy);
</script>

<template>
  <div v-if="props.isOpen" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />
    <div class="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#162033] shadow-2xl overflow-hidden">
      <div class="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 text-white/80 flex items-center justify-center">
            <component :is="active.icon" :size="20" />
          </div>
          <h2 class="text-2xl font-bold text-white">{{ active.title }}</h2>
        </div>
        <button @click="emit('close')" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center justify-center">
          <X :size="20" />
        </button>
      </div>

      <div class="p-6 space-y-4">
        <div
          v-for="(paragraph, index) in active.body"
          :key="index"
          class="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-white/80 leading-7"
        >
          {{ paragraph }}
        </div>
      </div>
    </div>
  </div>
</template>
