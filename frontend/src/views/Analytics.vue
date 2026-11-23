
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api';

const stats = ref<any>({});
const orders = ref<any[]>([]);
const error = ref('');

onMounted(async () => {
  try {
    const [s, o] = await Promise.all([
      api.get('/analytics'),
      api.get('/orders')
    ]);

    stats.value = s.data;
    orders.value = o.data;
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Не удалось загрузить аналитику';
  }
});

const paidOrders = () => orders.value.filter(o => o.status === 'PAID');

const average = () => {
  const paid = paidOrders();
  return paid.length
    ? paid.reduce((sum, o) => sum + Number(o.total), 0) / paid.length
    : 0;
};

const popular = () => {
  const dishes: Record<string, number> = {};

  for (const order of orders.value) {
    for (const item of order.items || []) {
      const name = item.menuItem?.name || `Блюдо №${item.menuItemId}`;
      dishes[name] = (dishes[name] || 0) + Number(item.quantity);
    }
  }

  return Object.entries(dishes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
};
</script>

<template>
  <section class="page">
    <p class="eyebrow">СТАТИСТИКА РЕСТОРАНА</p>
    <h1>Аналитика</h1>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="stats">
      <div class="stat">
        <small>Пользователи</small>
        <b>{{ stats.users || 0 }}</b>
      </div>
      <div class="stat">
        <small>Бронирования</small>
        <b>{{ stats.reservations || 0 }}</b>
      </div>
      <div class="stat">
        <small>Все заказы</small>
        <b>{{ stats.orders || 0 }}</b>
      </div>
      <div class="stat">
        <small>Выручка</small>
        <b>{{ Number(stats.revenue || 0).toLocaleString('ru-RU') }} BYN</b>
      </div>
    </div>

    <div class="panel">
      <h2>Дополнительные показатели</h2>
      <p>Оплаченных заказов: <b>{{ paidOrders().length }}</b></p>
      <p>Средний оплаченный чек:
        <b>{{ average().toLocaleString('ru-RU', { maximumFractionDigits: 2 }) }} BYN</b>
      </p>
    </div>

    <div class="panel">
      <h2>Популярные блюда</h2>
      <div class="record" v-for="dish in popular()" :key="dish[0]">
        <b>{{ dish[0] }}</b>
        <span>Заказано: {{ dish[1] }} шт.</span>
      </div>
      <p v-if="!popular().length" class="muted">Пока нет заказанных блюд.</p>
    </div>
  </section>
</template>
