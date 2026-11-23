
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Home from './views/Home.vue';
import Booking from './views/Booking.vue';
import Account from './views/Account.vue';
import Admin from './views/Admin.vue';
import Analytics from './views/Analytics.vue';
import { getUser } from './api';
import './style.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/booking', component: Booking },
    { path: '/account', component: Account },
    { path: '/admin', component: Admin },
    { path: '/analytics', component: Analytics },
  ]
});

router.beforeEach((to) => {
  const user = getUser();

  if (to.path === '/booking' || to.path === '/account') {
    if (!user) {
      return '/';
    }

    if (user.role !== 'CLIENT') {
      return user.role === 'ADMIN' || user.role === 'STAFF'
        ? '/admin'
        : '/';
    }
  }

  if (to.path === '/admin') {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return '/';
    }
  }

  return true;
});

createApp(App).use(router).mount('#app');
