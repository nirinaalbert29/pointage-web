<template>
  <div class="container p-4 mx-auto">
    <!-- Filtres de recherche -->
    <div class="flex flex-wrap gap-4 mb-4">
      <router-link to="/" class="px-2 transform group hover:scale-125">
        <svg class="w-9" viewBox="0 0 24 24">
          <path class="text-gray-600 fill-current group-hover:text-indigo-500" d="M15.41 16.58 10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.42z" />
        </svg>
      </router-link>
      <input
        v-model="searchQuery"
        class="p-2 border rounded"
        placeholder="Rechercher..."
      />
      <input
        type="date"
        v-model="searchDate"
        class="p-2 border rounded"
      />
      <button
        @click="openAddModal"
        class="px-4 py-2 text-white bg-blue-500 rounded"
      >
        Nouvelle absence
      </button>
    </div>

    <!-- Table des absences -->
    <table class="w-full border border-collapse">
      <thead>
        <tr class="bg-gray-100">
          <th class="p-2 border">ID</th>
          <th class="p-2 border">Employé</th>
          <th class="p-2 border">Motif</th>
          <th class="p-2 border">Nombre de jours</th>
          <th class="p-2 border">Date début</th>
          <th class="p-2 border">Date fin</th>
          <th class="p-2 border">Date d'enregistrement</th>
          <th class="p-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="absence in paginatedAbsences" :key="absence.id_abs">
          <td class="p-2 border">{{ absence.id_abs }}</td>
          <td class="p-2 border">{{ absence.im_emp }}</td>
          <td class="p-2 border">{{ absence.motif }}</td>
          <td class="p-2 border">{{ absence.nb_jours }}</td>
          <td class="p-2 border">{{ formatDate(absence.date_debut) }}</td>
          <td class="p-2 border">{{ formatDate(absence.date_fin) }}</td>
          <td class="p-2 border">{{ formatDate(absence.date_enregistre) }}</td>
          <td class="p-2 border">
            <button
              @click="openEditModal(absence)"
              class="px-2 py-1 mr-2 text-white bg-yellow-500 rounded"
            >
              Modifier
            </button>
            <button
              @click="confirmDelete(absence.id_abs)"
              class="px-2 py-1 text-white bg-red-500 rounded"
            >
              Supprimer
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="flex justify-center gap-2 mt-4">
      <button
        v-for="page in totalPages"
        :key="page"
        @click="currentPage = page"
        :class="[
          'px-3 py-1 rounded',
          currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200'
        ]"
      >
        {{ page }}
      </button>
    </div>

    <!-- Modal Ajout/Modification -->
    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div class="p-4 bg-white rounded-lg w-96">
        <h2 class="mb-4 text-xl">{{ isEditing ? 'Modifier' : 'Ajouter' }} une absence</h2>
        <form @submit.prevent="submitAbsence">
          <div class="mb-4">
            <label class="block mb-1">Employé (IM)</label>
            <input
              v-model="formData.im_emp"
              class="w-full p-2 border rounded"
              required
              @blur="checkEmploye"
            />
            <span v-if="employeError" class="text-sm text-red-500">{{ employeError }}</span>
          </div>
          <div class="mb-4">
            <label class="block mb-1">Motif</label>
            <textarea
              v-model="formData.motif"
              class="w-full p-2 border rounded"
              required
            ></textarea>
          </div>
          <div class="mb-4">
            <label class="block mb-1">Nombre de jours (max 3)</label>
            <input
              type="number"
              v-model="formData.nb_jours"
              class="w-full p-2 border rounded"
              required
              min="1"
              max="3"
            />
          </div>
          <div class="mb-4">
            <label class="block mb-1">Date de début</label>
            <input
              type="date"
              v-model="formData.date_debut"
              class="w-full p-2 border rounded"
              required
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-white bg-gray-500 rounded"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-white bg-blue-500 rounded"
              :disabled="!isEmployeValid || isSubmitting"
            >
              {{ isEditing ? 'Modifier' : 'Ajouter' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AbsenceList',
  data() {
    return {
      absences: [],
      searchQuery: '',
      searchDate: '',
      currentPage: 1,
      itemsPerPage: 10,
      showModal: false,
      isEditing: false,
      isSubmitting: false,
      employeError: '',
      isEmployeValid: false,
      formData: {
        im_emp: '',
        motif: '',
        nb_jours: '',
        date_debut: '',
      },
      selectedAbsence: null
    }
  },
  computed: {
    filteredAbsences() {
      return this.absences.filter(absence => {
        const matchesSearch = Object.values(absence)
          .join(' ')
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());
        
        const matchesDate = !this.searchDate || 
          this.formatDate(absence.date_enregistre).includes(this.searchDate);
        
        return matchesSearch && matchesDate;
      });
    },
    paginatedAbsences() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredAbsences.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredAbsences.length / this.itemsPerPage);
    }
  },
  methods: {
    async checkEmploye() {
      if (!this.formData.im_emp) {
        this.employeError = 'Le numéro IM est requis';
        this.isEmployeValid = false;
        return;
      }
      
      try {
        const response = await axios.get(`/api/employe/${this.formData.im_emp}`);
        if (response.data.status && response.data.employe) {
          this.isEmployeValid = true;
          this.employeError = '';
        } else {
          this.employeError = 'Employé non trouvé';
          this.isEmployeValid = false;
        }
      } catch (error) {
        this.employeError = 'Erreur lors de la vérification de l\'employé';
        this.isEmployeValid = false;
      }
    },
    async fetchAbsences() {
      try {
        const response = await axios.get('/api/absenceList');
        if (response.data.status) {
          this.absences = response.data.reponse;
        }
      } catch (error) {
        console.error('Erreur lors du chargement des absences:', error);
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
    openAddModal() {
      this.isEditing = false;
      this.formData = {
        im_emp: '',
        motif: '',
        nb_jours: '',
        date_debut: '',
      };
      this.showModal = true;
      this.isEmployeValid = false;
      this.employeError = '';
    },
    openEditModal(absence) {
      this.isEditing = true;
      this.selectedAbsence = absence;
      this.formData = {
        ...absence,
        date_debut: this.formatDateForInput(absence.date_debut)
      };
      this.showModal = true;
      this.isEmployeValid = true;
      this.employeError = '';
    },
    formatDateForInput(date) {
      return new Date(date).toISOString().split('T')[0];
    },
    closeModal() {
      this.showModal = false;
      this.formData = {
        im_emp: '',
        motif: '',
        nb_jours: '',
        date_debut: '',
      };
      this.isEmployeValid = false;
      this.employeError = '';
    },
    async submitAbsence() {
      if (!this.isEmployeValid || parseInt(this.formData.nb_jours) > 3) {
        return;
      }

      this.isSubmitting = true;
      
      try {
        const response = await axios.get(`/api/absence/total/${this.formData.im_emp}`);
        const totalDays = response.data.total || 0;
        
        let currentDays = 0;
        if (this.isEditing) {
          currentDays = this.selectedAbsence.nb_jours;
        }
        
        const newTotal = totalDays - currentDays + parseInt(this.formData.nb_jours);
        
        if (newTotal > 15) {
          alert('Erreur: Le nombre total de jours d\'absence ne peut pas dépasser 15 jours par an.');
          this.isSubmitting = false;
          return;
        }

        if (this.isEditing) {
          await axios.put(`/api/absence/${this.selectedAbsence.id_abs}`, this.formData);
          alert('Absence modifiée avec succès');
        } else {
          await axios.post('/api/absence', this.formData);
          alert('Absence ajoutée avec succès');
        }
        
        this.closeModal();
        this.fetchAbsences();
      } catch (error) {
        console.error('Erreur:', error);
        alert(error.response?.data?.message || 'Une erreur est survenue');
      } finally {
        this.isSubmitting = false;
      }
    },
    async confirmDelete(id) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette absence ?')) {
        try {
          await axios.delete(`/api/absence/${id}`);
          alert('Absence supprimée avec succès');
          this.fetchAbsences();
        } catch (error) {
          console.error('Erreur:', error);
          alert(error.response?.data?.message || 'Une erreur est survenue');
        }
      }
    }
  },
  mounted() {
    this.fetchAbsences();
  }
}
</script>