<template>
  <div class="flex flex-col w-full min-h-screen bg-gray-900">
    <!-- Header -->
    <div class="flex w-full p-4 bg-gray-800">
      <div class="flex items-center">
        <router-link to="/" class="px-2 transform group hover:scale-125">
          <svg class="w-9" viewBox="0 0 24 24">
            <path class="text-gray-600 fill-current group-hover:text-indigo-500" d="M15.41 16.58 10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.42z" />
          </svg>
        </router-link>
        <div class="text-2xl text-gray-50">Tableau de bord</div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="flex flex-wrap gap-4 p-4 bg-gray-800">
      <input 
        v-model="filters.employeeIM" 
        @input="debounceSearch"
        type="text" 
        placeholder="Rechercher par IM employé" 
        class="px-4 py-2 text-white bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input 
        type="month" 
        v-model="filters.selectedMonth"
        @change="fetchData" 
        class="px-4 py-2 text-white bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" 
      />
    </div>

    <!-- Statistiques -->
    <div class="p-6">
      <div v-if="loading" class="flex justify-center p-12">
        <div class="text-xl text-gray-400">Chargement...</div>
      </div>

      <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <!-- Total Employés -->
        <div class="p-6 bg-gray-800 rounded-lg shadow-lg">
          <h3 class="mb-4 text-xl font-bold text-indigo-500">Total Employés</h3>
          <div class="flex flex-col">
            <span class="text-4xl font-bold text-white">{{ totalEmployees }}</span>
          </div>
        </div>

        <!-- Présences -->
        <div class="p-6 bg-gray-800 rounded-lg shadow-lg">
          <h3 class="mb-4 text-xl font-bold text-emerald-500">Présences</h3>
          <div class="flex flex-col">
            <span class="text-4xl font-bold text-white">{{ stats.totalPresent }}</span>
            <span class="mt-2 text-gray-400">{{ calculatePercentage(stats.totalPresent) }}% du total</span>
          </div>
        </div>

        <!-- Absences -->
        <div class="p-6 bg-gray-800 rounded-lg shadow-lg">
          <h3 class="mb-4 text-xl font-bold text-red-500">Absences</h3>
          <div class="flex flex-col">
            <span class="text-4xl font-bold text-white">{{ stats.totalAbsent }}</span>
            <span class="mt-2 text-gray-400">{{ calculatePercentage(stats.totalAbsent) }}% du total</span>
          </div>
        </div>

        <!-- Retards -->
        <div class="p-6 bg-gray-800 rounded-lg shadow-lg">
          <h3 class="mb-4 text-xl font-bold text-orange-500">Retards</h3>
          <div class="flex flex-col">
            <span class="text-4xl font-bold text-white">{{ stats.totalRetards }}</span>
            <span class="mt-2 text-gray-400">{{ calculatePercentage(stats.totalRetards) }}% du total</span>
          </div>
        </div>

        <!-- Période -->
        <div class="p-6 bg-gray-800 rounded-lg shadow-lg">
          <h3 class="mb-4 text-xl font-bold text-blue-500">Période</h3>
          <div class="flex flex-col">
            <span class="text-lg text-white">{{ formatPeriod() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { debounce } from 'lodash';

export default {
  name: 'TableauDeBord',
  
  data() {
    return {
      loading: true,
      totalEmployees: 0,
      filters: {
        employeeIM: '',
        selectedMonth: '',
      },
      stats: {
        totalPresent: 0,
        totalAbsent: 0,
        totalRetards: 0
      }
    }
  },

  created() {
    this.initializeDefaultDate();
    this.fetchTotalEmployees();
    this.debounceSearch = debounce(this.fetchData, 300);
    this.fetchData();
  },

  methods: {
    initializeDefaultDate() {
      const date = new Date();
      date.setMonth(date.getMonth() - 1); // Mois précédent
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      this.filters.selectedMonth = `${year}-${month}`;
    },

    calculatePercentage(value) {
      const total = this.stats.totalPresent + this.stats.totalAbsent + this.stats.totalRetards;
      if (!total) return 0;
      return Math.round((value / total) * 100);
    },

    formatPeriod() {
      if (!this.filters.selectedMonth) return '';
      const [year, month] = this.filters.selectedMonth.split('-');
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    },

    async fetchTotalEmployees() {
      try {
        const response = await axios.get('/api/dashboard/total-employees');
        this.totalEmployees = response.data.total;
      } catch (error) {
        console.error('Erreur lors de la récupération du total des employés:', error);
      }
    },

    async fetchData() {
      this.loading = true;
      try {
        const [year, month] = this.filters.selectedMonth.split('-');
        const response = await axios.get('/api/dashboard/stats', {
          params: {
            year,
            month,
            employee: this.filters.employeeIM || null
          }
        });

        if (response.data.status && response.data.data) {
          this.stats = response.data.data;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>