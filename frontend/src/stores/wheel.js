import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';

export const useWheelStore = defineStore('wheel', () => {
  const config = ref(null);
  const tickets = ref(0);
  const lastPrize = ref(null);
  const spinning = ref(false);
  const loading = ref(false);

  async function fetchConfig() {
    config.value = await api.wheel.config();
  }

  async function fetchTickets() {
    try {
      const data = await api.wheel.tickets();
      tickets.value = data.count;
    } catch {
      tickets.value = 0;
    }
  }

  async function spin() {
    loading.value = true;
    try {
      const result = await api.wheel.spin();
      lastPrize.value = result.prize;
      tickets.value = Math.max(0, tickets.value - 1);
      spinning.value = true;
      return result;
    } finally {
      loading.value = false;
    }
  }

  function finishSpin() {
    spinning.value = false;
  }

  return { config, tickets, lastPrize, spinning, loading, fetchConfig, fetchTickets, spin, finishSpin };
});
