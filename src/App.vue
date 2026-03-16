<script setup lang="ts">
import { ref } from 'vue';
import Dashboard from './components/Dashboard.vue';
import LandingPage from './components/LandingPage.vue';
import AuthModal from './components/AuthModal.vue';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getAuthToken, getCurrentUser } from './services/api';
import { provideLanguage } from './context/language';

provideLanguage();

const currentUser = getCurrentUser();
const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('zenflow-auth', Boolean(getAuthToken() && currentUser));
const [userName, setUserName] = useLocalStorage<string>('zenflow-username', currentUser?.name || '');
const isAuthModalOpen = ref(false);

const handleLogin = async (user) => {
  setUserName(user.name);
  setIsAuthenticated(true);
};

const handleLogout = () => {
  setIsAuthenticated(false);
  setUserName('');
};
</script>

<template>
  <Dashboard
    v-if="isAuthenticated"
    :user-name="userName"
    @logout="handleLogout"
  />
  <template v-else>
    <LandingPage
      @get-started="isAuthModalOpen = true"
      @login="isAuthModalOpen = true"
      @google-login="handleLogin"
    />
    <AuthModal
      :is-open="isAuthModalOpen"
      @close="isAuthModalOpen = false"
      @login="handleLogin"
    />
  </template>
</template>
