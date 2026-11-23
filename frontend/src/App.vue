<script setup lang="ts">
import { ref } from 'vue';
import { getUser, api, saveSession, logout } from './api';
const user=ref(getUser()), email=ref(''), password=ref(''), name=ref(''), error=ref('');
async function login(){try{const {data}=await api.post('/auth/login',{email:email.value,password:password.value});saveSession(data);user.value=data.user;error.value='';}catch(e:any){error.value=e.response?.data?.message||'Не удалось войти';}}
async function register(){try{const {data}=await api.post('/auth/register',{name:name.value,email:email.value,password:password.value});saveSession(data);user.value=data.user;error.value='';}catch(e:any){error.value=e.response?.data?.message||'Не удалось зарегистрироваться';}}
function signout(){logout()}
</script>
<template>
<header class="top"><router-link class="brand" to="/">BISTRO</router-link>
   <nav>
  <router-link to="/">Меню</router-link>

  <template v-if="user?.role === 'CLIENT'">
    <router-link to="/booking">Бронирование</router-link>
    <router-link to="/account">Личный кабинет</router-link>
  </template>

  <router-link
    v-if="user && (user.role === 'ADMIN' || user.role === 'STAFF')"
    to="/admin"
  >
    Управление
  </router-link>

<router-link to="/analytics">Аналитика</router-link>
  
<router-link v-if="!user" to="/booking">
    Бронирование
  </router-link>
</nav>
<div v-if="user" class="userbox">{{user.name}} · {{user.role}} <button class="small" @click="signout">Выйти</button></div>
</header>
<div v-if="!user" class="authbar"><form @submit.prevent="login"><input v-model="email" type="email" placeholder="Email" required><input v-model="password" type="password" placeholder="Пароль" required><button>Войти</button></form><details><summary>Регистрация клиента</summary><form @submit.prevent="register"><input v-model="name" placeholder="Имя" required><input v-model="email" type="email" placeholder="Email" required><input v-model="password" type="password" placeholder="Пароль (от 6 символов)" minlength="6" required><button>Зарегистрироваться</button></form></details><span class="error">{{error}}</span></div>
<main><router-view /></main><footer>© 2026 BISTRO · Система управления рестораном</footer>
</template>
