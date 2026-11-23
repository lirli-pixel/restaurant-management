<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api, getUser, logout } from '../api';

const user = getUser();

const menu = ref<any[]>([]);
const tables = ref<any[]>([]);
const reservations = ref<any[]>([]);
const orders = ref<any[]>([]);
const stats = ref<any>({});
const error = ref('');

const name = ref('');
const category = ref('Горячее');
const price = ref(0);
const description = ref('');

const selectedImages = ref<Record<number, File | null>>({});
const uploading = ref<Record<number, boolean>>({});

// Черновики состава заказов для редактирования
type OrderDraftItem = {
  menuItemId: number;
  quantity: number;
  menuItemName: string;
};

const orderDrafts = ref<Record<number, OrderDraftItem[]>>({});

async function load() {
  try {
    const [m, t, r, o] = await Promise.all([
      api.get('/menu'),
      api.get('/tables'),
      api.get('/reservations'),
      api.get('/orders'),
    ]);

    menu.value = m.data;
    tables.value = t.data;
    reservations.value = r.data;
    orders.value = o.data;

    if (user?.role === 'ADMIN') {
      stats.value = (await api.get('/analytics')).data;
    }
  } catch (e: any) {
    error.value =
      e.response?.data?.message || 'Нет доступа или сервер недоступен';
  }
}

onMounted(load);

async function addDish() {
  try {
    await api.post('/menu', {
      name: name.value,
      category: category.value,
      price: Number(price.value),
      description: description.value,
    });

    name.value = '';
    description.value = '';
    await load();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Ошибка добавления блюда';
  }
}

async function statusReservation(id: number, status: string) {
  try {
    await api.patch(`/reservations/${id}/status`, { status });
    await load();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Не удалось изменить бронирование';
  }
}

async function statusOrder(id: number, status: string) {
  try {
    await api.patch(`/orders/${id}/status`, { status });
    await load();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Не удалось изменить заказ';
  }
}

async function deleteDish(id: number) {
  if (!confirm('Убрать блюдо из меню?')) return;

  try {
    await api.delete(`/menu/${id}`);
    await load();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Не удалось удалить блюдо';
  }
}

function selectImage(id: number, event: Event) {
  const input = event.target as HTMLInputElement;
  selectedImages.value[id] = input.files?.[0] || null;
}

async function uploadImage(id: number) {
  const file = selectedImages.value[id];

  if (!file) {
    error.value = 'Сначала выберите фотографию блюда';
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Выберите изображение JPG, PNG или WebP';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Размер изображения не должен превышать 5 МБ';
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  uploading.value[id] = true;
  error.value = '';

  try {
    await api.post(`/menu/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    selectedImages.value[id] = null;
    await load();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Не удалось загрузить фотографию';
  } finally {
    uploading.value[id] = false;
  }
}

// Получить список блюд для выбора в заказе.
// Сохраняем в списке также блюдо, если его уже нет в меню.
function orderMenuOptions(order: any) {
  const options = [...menu.value];

  for (const item of order.items || []) {
    const id = item.menuItemId;

    if (!options.some(m => m.id === id)) {
      options.push({
        id,
        name: item.menuItem?.name || `Блюдо №${id}`,
        available: false,
      });
    }
  }

  return options;
}

// Начать редактирование состава заказа
function editOrder(order: any) {
  orderDrafts.value[order.id] = (order.items || []).map((item: any) => ({
    menuItemId: item.menuItemId,
    quantity: Number(item.quantity),
    menuItemName: item.menuItem?.name || `Блюдо №${item.menuItemId}`,
  }));
}

// Добавить новую позицию в черновик
function addOrderItem(order: any) {
  if (!orderDrafts.value[order.id]) {
    editOrder(order);
  }

  const availableItem = menu.value.find(m => m.available);

  if (!availableItem) {
    error.value = 'Нет доступных блюд для добавления';
    return;
  }

  const existing = orderDrafts.value[order.id].find(
    item => item.menuItemId === availableItem.id
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    orderDrafts.value[order.id].push({
      menuItemId: availableItem.id,
      quantity: 1,
      menuItemName: availableItem.name,
    });
  }

  error.value = '';
}

// Удалить позицию из черновика
function removeOrderItem(orderId: number, index: number) {
  const draft = orderDrafts.value[orderId];

  if (!draft || draft.length <= 1) {
    error.value = 'В заказе должна остаться хотя бы одна позиция';
    return;
  }

  draft.splice(index, 1);
  error.value = '';
}

// Сохранить новый состав заказа
async function saveOrderItems(order: any) {
  const draft = orderDrafts.value[order.id];

  if (!draft || draft.length === 0) {
    error.value = 'В заказе должна быть хотя бы одна позиция';
    return;
  }

  for (const item of draft) {
    if (
      !Number.isInteger(Number(item.menuItemId)) ||
      !Number.isInteger(Number(item.quantity)) ||
      item.quantity < 1 ||
      item.quantity > 50
    ) {
      error.value = 'Проверьте выбранные блюда и количество (от 1 до 50)';
      return;
    }
  }

  try {
    error.value = '';

    await api.patch(`/orders/${order.id}/items`, {
      items: draft.map(item => ({
        menuItemId: Number(item.menuItemId),
        quantity: Number(item.quantity),
      })),
    });

    delete orderDrafts.value[order.id];
    await load();
  } catch (e: any) {
    error.value =
      e.response?.data?.message || 'Не удалось сохранить состав заказа';
  }
}

// Отменить редактирование
function cancelOrderEdit(orderId: number) {
  delete orderDrafts.value[orderId];
  error.value = '';
}
</script>

<template>
  <section class="page">
    <p class="eyebrow">ПАНЕЛЬ УПРАВЛЕНИЯ</p>
    <h1>Управление рестораном</h1>

    <p v-if="user?.role === 'CLIENT' || !user" class="error">
      Для доступа войдите как администратор или сотрудник.
    </p>

    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="user && user.role !== 'CLIENT'">
      <div v-if="user.role === 'ADMIN'" class="stats">
        <div class="stat">
          <small>Пользователи</small>
          <b>{{ stats.users || 0 }}</b>
        </div>
        <div class="stat">
          <small>Бронирования</small>
          <b>{{ stats.reservations || 0 }}</b>
        </div>
        <div class="stat">
          <small>Заказы</small>
          <b>{{ stats.orders || 0 }}</b>
        </div>
        <div class="stat">
          <small>Выручка</small>
          <b>{{ Number(stats.revenue || 0).toLocaleString('ru-RU') }} BYN</b>
        </div>
      </div>

      <div class="panel">
        <h2>Меню ресторана</h2>

        <form class="inlineform" @submit.prevent="addDish">
          <input v-model="name" placeholder="Название блюда" required />
          <input v-model="category" placeholder="Категория" required />
          <input
            v-model.number="price"
            type="number"
            min="1"
            placeholder="Цена"
            required
          />
          <input v-model="description" placeholder="Описание" />
          <button type="submit">Добавить</button>
        </form>

        <div class="record" v-for="m in menu" :key="m.id">
          <div>
            <b>{{ m.name }}</b>
            <span>{{ m.category }} · {{ Number(m.price) }} BYN</span>

            <div v-if="m.imageUrl" class="dish-image-preview">
              <img :src="`http://localhost:3000/${m.imageUrl}`" :alt="m.name" />
            </div>

            <div v-if="user.role === 'ADMIN'" class="image-upload">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                @change="selectImage(m.id, $event)"
              />
              <button
                type="button"
                class="small"
                :disabled="!selectedImages[m.id] || uploading[m.id]"
                @click="uploadImage(m.id)"
              >
                {{ uploading[m.id] ? 'Загрузка...' : 'Загрузить фото' }}
              </button>
            </div>
          </div>

          <button
            v-if="user.role === 'ADMIN'"
            type="button"
            class="danger small"
            @click="deleteDish(m.id)"
          >
            Удалить
          </button>
        </div>
      </div>

      <div class="panel">
        <h2>Бронирования</h2>

        <div class="record" v-for="r in reservations" :key="r.id">
          <b>{{ r.user.name }} · столик №{{ r.table.number }}</b>
          <span>
            {{ new Date(r.startAt).toLocaleString('ru-RU') }} ·
            {{ r.guests }} гостей · {{ r.status }}
          </span>
          <div class="actions">
            <button
              class="small"
              @click="statusReservation(r.id, 'CONFIRMED')"
            >
              Подтвердить
            </button>
            <button
              class="danger small"
              @click="statusReservation(r.id, 'CANCELLED')"
            >
              Отменить
            </button>
            <button
              class="small"
              @click="statusReservation(r.id, 'COMPLETED')"
            >
              Завершить
            </button>
          </div>
        </div>

        <p v-if="!reservations.length" class="muted">
          Бронирований пока нет.
        </p>
      </div>

      <div class="panel">
        <h2>Заказы</h2>

        <div class="record order-record" v-for="o in orders" :key="o.id">
          <b>Заказ №{{ o.id }} · {{ o.user.name }}</b>
          <span>{{ o.status }} · {{ Number(o.total) }} BYN</span>

          <!-- Текущий состав заказа -->
          <div class="order-items">
            <b>Состав заказа:</b>
            <div v-for="item in o.items" :key="item.id">
              {{ item.menuItem?.name || `Блюдо №${item.menuItemId}` }}
              × {{ item.quantity }}
            </div>
          </div>

          <!-- Редактирование доступно только администратору -->
          <div v-if="user.role === 'ADMIN'" class="order-editor">
            <button
              v-if="!orderDrafts[o.id]"
              type="button"
              class="small"
              @click="editOrder(o)"
            >
              Изменить состав
            </button>

            <div v-else class="order-edit-form">
              <b>Редактирование состава</b>

              <div
                class="order-edit-row"
                v-for="(line, index) in orderDrafts[o.id]"
                :key="index"
              >
                <select v-model.number="line.menuItemId">
                  <option
                    v-for="m in orderMenuOptions(o)"
                    :key="m.id"
                    :value="m.id"
                    :disabled="m.available === false && m.id !== line.menuItemId"
                  >
                    {{ m.name }}
                  </option>
                </select>

                <input
                  v-model.number="line.quantity"
                  type="number"
                  min="1"
                  max="50"
                  aria-label="Количество блюд"
                />

                <button
                  type="button"
                  class="danger small"
                  :disabled="orderDrafts[o.id].length <= 1"
                  @click="removeOrderItem(o.id, index)"
                >
                  Убрать
                </button>
              </div>

              <div class="actions">
                <button
                  type="button"
                  class="small"
                  @click="addOrderItem(o)"
                >
                  + Добавить блюдо
                </button>

                <button
                  type="button"
                  class="small"
                  @click="saveOrderItems(o)"
                >
                  Сохранить состав
                </button>

                <button
                  type="button"
                  class="danger small"
                  @click="cancelOrderEdit(o.id)"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="small" @click="statusOrder(o.id, 'PREPARING')">
              Готовится
            </button>
            <button class="small" @click="statusOrder(o.id, 'READY')">
              Готов
            </button>
            <button class="small" @click="statusOrder(o.id, 'PAID')">
              Оплачен
            </button>
            <button
              class="danger small"
              @click="statusOrder(o.id, 'CANCELLED')"
            >
              Отменить
            </button>
          </div>
        </div>

        <p v-if="!orders.length" class="muted">Заказов пока нет.</p>
      </div>

      <div class="panel">
        <h2>Столики</h2>
        <span class="tablechip" v-for="t in tables" :key="t.id">
          №{{ t.number }} · {{ t.seats }} мест
        </span>
      </div>
    </template>
  </section>
</template>

<style scoped>
.dish-image-preview {
  margin-top: 10px;
}

.dish-image-preview img {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
}

.image-upload {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.image-upload input {
  max-width: 240px;
}

.image-upload button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.order-items {
  margin-top: 10px;
  line-height: 1.7;
}

.order-editor {
  margin-top: 12px;
}

.order-edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
  padding: 14px;
  border-radius: 10px;
  background: #f7f3ed;
}

.order-edit-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.order-edit-row select {
  flex: 1 1 180px;
  min-width: 0;
}

.order-edit-row input {
  width: 75px;
}

.order-edit-row button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
