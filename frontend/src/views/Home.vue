<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api';

const items = ref<any[]>([]);
const error = ref('');
const cart = ref<Record<number, number>>({});
const message = ref('');

onMounted(async () => {
  try {
    items.value = (await api.get('/menu')).data;
  } catch {
    error.value = 'Не удалось загрузить меню. Проверьте, запущен ли сервер.';
  }
});

function imageFor(item: any) {
if (item.imageUrl) {
return `http://localhost:3000${item.imageUrl}`;
}

const name = String(item.name ?? '').toLowerCase();

if (name.includes('борщ')) {
return 'https://images.unsplash.com/photo-1527976746453-f363eac4d889?auto=format&fit=crop&w=800&q=80';
}
if (name.includes('цезарь')) {
return 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800';
}
if (name.includes('карбонара')) {
return 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800';
}
if (name.includes('стейк')) {
return 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800';
}
if (name.includes('чизкейк')) {
return 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800';
}
if (name.includes('морс')) {
return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800';
}

return '';
}

function add(id: number) {
  cart.value[id] = (cart.value[id] ?? 0) + 1;
  message.value = 'Блюдо добавлено в заказ';
}

async function sendOrder() {
  try {
    await api.post('/orders', {
      items: Object.entries(cart.value).map(([menuItemId, quantity]) => ({
        menuItemId: Number(menuItemId),
        quantity
      }))
    });
    cart.value = {};
    message.value = 'Заказ успешно создан. Его статус доступен в личном кабинете.';
  } catch (e: any) {
    message.value = e.response?.data?.message || 'Войдите в аккаунт, чтобы оформить заказ.';
  }
}
</script>

<template>
  <main class="home-page">
    <section class="hero">
      <div class="hero-content">
        <p class="eyebrow">РЕСТОРАН · КАФЕ · ВСТРЕЧИ</p>
        <h1>Вкусные моменты<br>начинаются здесь.</h1>
        <p class="hero-description">Выбирайте блюда и бронируйте удобный столик онлайн.</p>
        <router-link class="button" to="/booking">Забронировать столик</router-link>
      </div>

      <div class="hero-art">
        <img
          src="https://images.unsplash.com/photo-1547592180-85f173990554?w=1000"
          alt="Блюда ресторана"
        >
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <p class="eyebrow">НАШЕ МЕНЮ</p>
          <h2>Популярные блюда</h2>
        </div>
        <router-link to="/booking">Забронировать →</router-link>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="menu-grid">
        <article class="dish" v-for="item in items" :key="item.id">
          <div class="dish-image-wrap">
            <img class="dish-photo" :src="item.imageUrl ? `http://localhost:3000${item.imageUrl}` : imageFor(item)" :alt="item.name" loading="lazy">
          </div>

          <div class="dish-content">
            <div class="dish-meta">{{ item.category }}</div>
            <h3>{{ item.name }}</h3>
            <p>{{ item.description }}</p>

            <div class="dish-bottom">
              <strong>{{ Number(item.price).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} BYN</strong>
              <button class="small order-add" @click="add(item.id)">В заказ +</button>
            </div>
          </div>
        </article>
      </div>

      <div class="cartbar" v-if="Object.keys(cart).length">
        <span>Позиций в заказе: {{ Object.values(cart).reduce((a, b) => a + b, 0) }}</span>
        <button @click="sendOrder">Оформить заказ</button>
      </div>

      <p class="success">{{ message }}</p>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  width: 100%;
  max-width: none;
  margin: 0;
  overflow: hidden;
  box-sizing: border-box;
  background: transparent;
}

.hero {
  background: #f5f0e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(24px, 4vw, 56px);
  padding: clamp(38px, 5vw, 64px) clamp(28px, 7vw, 96px);
  box-sizing: border-box;
}

.hero-content {
  flex: 1 1 52%;
  min-width: 0;
}

.hero-content .eyebrow,
.section-head .eyebrow {
  font-size: 11px;
  letter-spacing: 2px;
  line-height: 1.5;
  margin: 0 0 12px;
}

.hero-content h1 {
  font-size: clamp(34px, 4vw, 52px);
  line-height: 1.12;
  margin: 0 0 18px;
  overflow-wrap: break-word;
}

.hero-description {
  max-width: 440px;
  font-size: 15px;
  line-height: 1.65;
  margin: 0 0 24px;
}

.hero-art {
  flex: 0 1 42%;
  max-width: 460px;
  height: 270px;
  border-radius: 16px;
  overflow: hidden;
}

.hero-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.section {
  background: transparent;
  padding: 40px clamp(28px, 7vw, 96px) 58px;
  box-sizing: border-box;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 22px;
}

.section-head h2 {
  font-size: clamp(25px, 2.4vw, 31px);
  line-height: 1.2;
  margin: 0;
}

.section-head > a {
  white-space: nowrap;
  font-size: 14px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(205px, 1fr));
  gap: 20px;
  align-items: stretch;
}

.dish {
  min-width: 0;
  overflow: hidden;
  border-radius: 14px;
  padding: 10px;
  background: #fff;
  box-shadow: 0 5px 22px rgba(60, 40, 25, .07);
  transition: transform .2s ease, box-shadow .2s ease;
  display: flex;
  flex-direction: column;
}

.dish:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(60, 40, 25, .11);
}

.dish-image-wrap {
  width: 100%;
  height: 165px;
  overflow: hidden;
  border-radius: 10px;
  flex-shrink: 0;
}

.dish-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .3s ease;
}

.dish:hover .dish-photo {
  transform: scale(1.03);
}

.dish-content {
  padding: 10px 4px 4px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.dish-meta {
  font-size: 11px;
  line-height: 1.4;
  opacity: .65;
  margin-bottom: 5px;
}

.dish h3 {
  font-size: 17px;
  line-height: 1.3;
  margin: 4px 0 8px;
}

.dish p {
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  flex: 1;
}

.dish-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 13px;
}

.dish-bottom strong {
  font-size: 15px;
  white-space: nowrap;
}

.order-add {
  font-size: 12px;
  padding: 7px 10px;
  white-space: nowrap;
}

.cartbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 16px 20px;
  margin-top: 26px;
  border-radius: 12px;
  background: #f4eee7;
}

.success {
  margin-top: 12px;
}

@media (max-width: 760px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
    gap: 24px;
    padding: 34px 22px;
  }

  .hero-content h1 {
    font-size: clamp(32px, 8vw, 44px);
  }

  .hero-art {
    flex: auto;
    width: 100%;
    max-width: none;
    height: 220px;
  }

  .section {
    padding: 34px 22px 44px;
  }

  .menu-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .dish {
    padding: 8px;
  }

  .dish-image-wrap {
    height: 135px;
  }

  .dish h3 {
    font-size: 15px;
  }

  .dish p {
    font-size: 12px;
  }

  .dish-bottom {
    flex-direction: column;
    align-items: stretch;
  }

  .dish-bottom strong {
    font-size: 14px;
  }

  .dish-bottom button {
    width: 100%;
  }

  .cartbar {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 420px) {
  .menu-grid {
    grid-template-columns: 1fr;
  }

  .dish-image-wrap {
    height: 185px;
  }

  .section-head {
    align-items: flex-start;
  }
}
</style>
