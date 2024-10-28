// CongeList.vue
<template>
    <div class="container p-4 mx-auto">
      <!-- Filtres de recherche -->
      <div class="flex flex-wrap gap-4 mb-4">
            <router-link to="/" class="px-2 transform  group hover:scale-125">
                <svg class=" w-9" viewBox="0 0 24 24">
                    <path class="text-gray-600 fill-current  group-hover:text-indigo-500" d="M15.41 16.58 10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.42z" /></svg>
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
          Nouveau congé
        </button>
      </div>
  
      <!-- Table des congés -->
      <table class="w-full border border-collapse">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2 border">ID</th>
            <th class="p-2 border">Employé</th>
            <th class="p-2 border">Type</th>
            <th class="p-2 border">Motif</th>
            <th class="p-2 border">Nombre de jours</th>
            <th class="p-2 border">Date d'enregistrement</th>
            <th class="p-2 border">État</th>
            <th class="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="conge in paginatedConges" :key="conge.id_conge">
            <td class="p-2 border">{{ conge.id_conge }}</td>
            <td class="p-2 border">{{ conge.im_emp }}</td>
            <td class="p-2 border">{{ conge.type_conge }}</td>
            <td class="p-2 border">{{ conge.motif_conge }}</td>
            <td class="p-2 border">{{ conge.nbr_jour }}</td>
            <td class="p-2 border">{{ formatDate(conge.conge_date_enreg) }}</td>
            <td class="p-2 border">{{ conge.etat_conge ? 'Actif' : 'Inactif' }}</td>
            <td class="p-2 border">
              <button
                @click="openEditModal(conge)"
                class="px-2 py-1 mr-2 text-white bg-yellow-500 rounded"
              >
                Modifier
              </button>
              <button
                @click="confirmDelete(conge.id_conge)"
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
          <h2 class="mb-4 text-xl">{{ isEditing ? 'Modifier' : 'Ajouter' }} un congé</h2>
          <form @submit.prevent="submitConge">
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
              <label class="block mb-1">Type de congé</label>
              <select
                v-model="formData.type_conge"
                class="w-full p-2 border rounded"
                required
              >
                <option value="annuel">Annuel</option>
                <option value="maladie">Maladie</option>
                <option value="maternite">Maternité</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block mb-1">Motif</label>
              <textarea
                v-model="formData.motif_conge"
                class="w-full p-2 border rounded"
                required
              ></textarea>
            </div>
            <div class="mb-4">
              <label class="block mb-1">Nombre de jours</label>
              <input
                type="number"
                v-model="formData.nbr_jour"
                class="w-full p-2 border rounded"
                required
                min="1"
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
    name: 'CongeList',
    data() {
      return {
        conges: [],
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
          type_conge: '',
          motif_conge: '',
          nbr_jour: '',
          etat_conge: 1
        },
        selectedConge: null
      }
    },
    computed: {
      filteredConges() {
        return this.conges.filter(conge => {
          const matchesSearch = Object.values(conge)
            .join(' ')
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase());
          
          const matchesDate = !this.searchDate || 
            this.formatDate(conge.conge_date_enreg).includes(this.searchDate);
          
          return matchesSearch && matchesDate;
        });
      },
      paginatedConges() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.filteredConges.slice(start, end);
      },
      totalPages() {
        return Math.ceil(this.filteredConges.length / this.itemsPerPage);
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
      async fetchConges() {
        try {
          const response = await axios.get('/api/congeList');
          if (response.data.status) {
            this.conges = response.data.reponse;
          }
        } catch (error) {
          console.error('Erreur lors du chargement des congés:', error);
        }
      },
      formatDate(date) {
        return new Date(date).toLocaleDateString();
      },
      openAddModal() {
        this.isEditing = false;
        this.formData = {
          im_emp: '',
          type_conge: '',
          motif_conge: '',
          nbr_jour: '',
          etat_conge: 1
        };
        this.showModal = true;
        this.isEmployeValid = false;
        this.employeError = '';
      },
      openEditModal(conge) {
        this.isEditing = true;
        this.selectedConge = conge;
        this.formData = { ...conge };
        this.showModal = true;
        this.isEmployeValid = true;
        this.employeError = '';
      },
      closeModal() {
        this.showModal = false;
        this.formData = {
          im_emp: '',
          type_conge: '',
          motif_conge: '',
          nbr_jour: '',
          etat_conge: 1
        };
        this.isEmployeValid = false;
        this.employeError = '';
      },
      async submitConge() {
        if (!this.isEmployeValid) {
          return;
        }

        this.isSubmitting = true;
        
        try {
          // Vérifier le nombre de jours de congés déjà pris
          const response = await axios.get(`/api/conge/total/${this.formData.im_emp}`);
          const totalDays = response.data.total || 0;
          
          // Si on modifie, on soustrait d'abord les jours actuels
          let currentDays = 0;
          if (this.isEditing) {
            currentDays = this.selectedConge.nbr_jour;
          }
          
          const newTotal = totalDays - currentDays + parseInt(this.formData.nbr_jour);
          
          if (newTotal > 30) {
            alert('Erreur: Le nombre total de jours de congés ne peut pas dépasser 30 jours par an.');
            this.isSubmitting = false;
            return;
          }
  
          if (this.isEditing) {
            await axios.put(`/api/conge/${this.selectedConge.id_conge}`, this.formData);
            alert('Congé modifié avec succès');
          } else {
            await axios.post('/api/conge', this.formData);
            alert('Congé ajouté avec succès');
          }
          
          this.closeModal();
          this.fetchConges();
        } catch (error) {
          console.error('Erreur:', error);
          alert(error.response?.data?.message || 'Une erreur est survenue');
        } finally {
          this.isSubmitting = false;
        }
      },
      async confirmDelete(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce congé ?')) {
          try {
            await axios.delete(`/api/conge/${id}`);
            alert('Congé supprimé avec succès');
            this.fetchConges();
          } catch (error) {
            console.error('Erreur:', error);
            alert(error.response?.data?.message || 'Une erreur est survenue');
          }
        }
      }
    },
    mounted() {
      this.fetchConges();
    }
  }
  </script>