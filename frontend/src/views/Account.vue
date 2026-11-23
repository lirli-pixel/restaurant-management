
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api, getUser } from '../api';

const user = getUser();
const reservations = ref<any[]>([]);
const orders = ref<any[]>([]);
const error = ref('');

onMounted(async () => {
  if (!user) {
    error.value = 'Войдите в аккаунт, чтобы увидеть свои данные';
    return;
  }

  if (user.role !== 'CLIENT') {
    error.value = 'Личный кабинет доступен только клиентам';
    return;
  }

  try {
    const [r, o] = await Promise.all([
      api.get('/reservations'),
      api.get('/orders')
    ]);

    reservations.value = r.data;
    orders.value = o.data;
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Не удалось загрузить данные';
  }
});

const date = (v: string) => new Date(v).toLocaleString('ru-RU');
</script>

<template>
  <section class="page">
    <p class="eyebrow">ЛИЧНЫЙ КАБИНЕТ</p>
    <h1>Здравствуйте, {{ user?.name || 'гость' }}!</h1>

    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="user?.role === 'CLIENT'">
      <div class="columns">
        <div class="panel">
          <h2>Мои бронирования</h2>

          <article class="record" v-for="r in reservations" :key="r.id">
            <b>Столик №{{ r.table.number }}</b>
            <span>{{ date(r.startAt) }}</span>
            <span>Гостей: {{ r.guests }} · {{ r.status }}</span>
          </article>

          <p v-if="!reservations.length" class="muted">
            Пока нет бронирований.
          </p>
        </div>

        <div class="panel">
          <h2>Мои заказы</h2>

          <article class="record" v-for="o in orders" :key="o.id">
            <b>Заказ №{{ o.id }}</b>
            <span>{{ date(o.createdAt) }} · {{ o.status }}</span>
            <strong>{{ Number(o.total).toLocaleString('ru-RU') }} ₽</strong>
            <small v-for="i in o.items" :key="i.id">
              {{ i.menuItem.name }} × {{ i.quantity }}
            </small>
          </article>

          <p v-if="!orders.length" class="muted">
            Пока нет заказов.
          </p>
        </div>
      </div>

      <router-link class="button" to="/booking">
        Новое бронирование
      </router-link>
    </template>
  </section>
</template>
