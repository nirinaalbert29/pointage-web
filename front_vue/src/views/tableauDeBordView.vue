<template>
    <div class="flex flex-col w-full">
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
      <div class="flex gap-4 p-4 bg-gray-700">
        <select v-model="selectedEmployee" class="px-4 py-2 text-white bg-gray-600 rounded">
          <option value="all">Tous les employés</option>
          <option v-for="emp in employees" :key="emp.emp_im" :value="emp.emp_im">
            {{ emp.emp_nom }}
          </option>
        </select>
  
        <input type="month" v-model="selectedDate" class="px-4 py-2 text-white bg-gray-600 rounded" />
      </div>
  
      <!-- Contenu principal -->
      <div class="flex flex-1 gap-6 p-6">
        <!-- Côté gauche -->
        <div class="w-1/2 space-y-6">
          <div class="p-6 transition-transform transform bg-gray-800 rounded-lg hover:scale-105">
            <h3 class="mb-4 text-xl font-bold text-indigo-500">Total Employés</h3>
            <div class="text-4xl text-white">{{ stats.totalEmployees }}</div>
          </div>
  
          <div class="p-6 transition-transform transform bg-gray-800 rounded-lg hover:scale-105">
            <h3 class="mb-4 text-xl font-bold text-orange-500">Total Heures Retard</h3>
            <div class="text-4xl text-white">{{ stats.totalDelayHours }}h</div>
          </div>
        </div>
  
        <!-- Côté droit -->
        <div class="w-1/2 space-y-6">
          <div class="p-6 transition-transform transform bg-gray-800 rounded-lg hover:scale-105">
            <h3 class="mb-4 text-xl font-bold text-emerald-500">Présences</h3>
            <div class="flex items-center justify-between">
              <div class="text-4xl text-white">{{ stats.totalPresent }}</div>
              <div class="text-lg text-gray-400">{{ stats.presentPercentage }}%</div>
            </div>
            <div class="h-2 mt-4 bg-gray-700 rounded-full">
              <div class="h-2 transition-all duration-500 rounded-full bg-emerald-500"
                :style="{ width: `${stats.presentPercentage}%` }"></div>
            </div>
          </div>
  
          <div class="p-6 transition-transform transform bg-gray-800 rounded-lg hover:scale-105">
            <h3 class="mb-4 text-xl font-bold text-red-500">Absences</h3>
            <div class="flex items-center justify-between">
              <div class="text-4xl text-white">{{ stats.totalAbsent }}</div>
              <div class="text-lg text-gray-400">{{ stats.absentPercentage }}%</div>
            </div>
            <div class="h-2 mt-4 bg-gray-700 rounded-full">
              <div class="h-2 transition-all duration-500 bg-red-500 rounded-full"
                :style="{ width: `${stats.absentPercentage}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        selectedEmployee: 'all',
        selectedDate: new Date().toISOString().slice(0, 7), // Format YYYY-MM
        employees: [],
        stats: {
          totalEmployees: 0,
          totalDelayHours: 0,
          totalPresent: 0,
          totalAbsent: 0,
          presentPercentage: 0,
          absentPercentage: 0
        }
      }
    },
  
    watch: {
      selectedEmployee: 'fetchStats',
      selectedDate: 'fetchStats'
    },
  
    methods: {
      async fetchEmployees() {
        try {
          const response = await this.$axios.get('/api/employees');
          this.employees = response.data;
        } catch (error) {
          console.error('Erreur lors de la récupération des employés:', error);
        }
      },
  
      async fetchStats() {
        try {
          const [year, month] = this.selectedDate.split('-');
          const params = {
            employee: this.selectedEmployee,
            year,
            month
          };
  
          const response = await this.$axios.get('/api/dashboard/stats', { params });
          const data = response.data;
  
          // Calculer les pourcentages
          const total = data.totalPresent + data.totalAbsent;
          this.stats = {
            ...data,
            presentPercentage: Math.round((data.totalPresent / total) * 100) || 0,
            absentPercentage: Math.round((data.totalAbsent / total) * 100) || 0
          };
        } catch (error) {
          console.error('Erreur lors de la récupération des statistiques:', error);
        }
      }
    },
  
    async mounted() {
      await this.fetchEmployees();
      await this.fetchStats();
    }
  }
  </script>
  
  <style scoped>
  .bg-shapes {
    background: rgba(128, 128, 128, 0.068);
  }
  </style>