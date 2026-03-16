# ZenFlow - O'rnatish Qo'llanmasi

Ushbu loyihani kompyuteringizga yuklab olganingizdan so'ng, uni ishga tushirish uchun quyidagi qadamlarni bajaring:

## 1. Kerakli dasturlar
Kompyuteringizda **Node.js** o'rnatilgan bo'lishi shart. 
Tekshirish uchun terminalda: `node -v`

## 2. O'rnatish
Loyiha papkasiga kiring va terminalda quyidagi buyruqni yozing:

```bash
# Barcha kerakli kutubxonalarni o'rnatish
npm install
# yoki (agar yarn bo'lsa)
yarn install
```

## 3. Ishga tushirish (Frontend + Backend)
Loyihada endi Express backend bor. Ikkalasini birga ishga tushirish uchun:

```bash
npm run dev:full
```

Brauzerda `http://localhost:5173` manziliga kiring. (Frontend endi Vue 3)

## 4. Alohida ishga tushirish (ixtiyoriy)

Faqat frontend:

```bash
npm run dev
```

Faqat backend:

```bash
npm run server
```

Backend API: `http://localhost:4000/api`

## 5. Saytni Internetga chiqarish (Build)
Agar saytni hostingga (Vercel, Netlify) joylamoqchi bo'lsangiz, avval uni "quring" (build):

```bash
npm run build
```
Bu `dist` papkasini yaratadi. Shu papkani hostingga yuklaysiz.

---
**Mualliflik:** ZenFlow jamoasi
