<template>
  <div class="employee-page">
    <!-- En-tête avec bouton d'ajout -->
    <div class="header">
            <router-link to="/" class="px-2 transform group hover:scale-125">
                <svg class=" w-9" viewBox="0 0 24 24">
                    <path class="text-gray-600 fill-current group-hover:text-indigo-500" d="M15.41 16.58 10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.42z" /></svg>
            </router-link>
      <h1>Gestion des employés</h1>
      <button @click="showModal = true" class="btn btn-primary">
        Ajouter un employé
      </button>
    </div>

    <!-- Table des employés -->
    <div class="table-container">
      <table class="employee-table">
        <thead>
          <tr>
            <th>IM</th>
            <th>Nom et Prénom</th>
            <th>Date de naissance</th>
            <th>Sexe</th>
            <th>Fonction</th>
            <th>Téléphone</th>
            <th>Adresse</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in employeeList" :key="employee.emp_im">
            <td>{{ employee.emp_im }}</td>
            <td>{{ employee.emp_nom_prenom }}</td>
            <td>{{ formatDate(employee.date_naiss) }}</td>
            <td>{{ employee.sexe }}</td>
            <td>{{ employee.emp_fonction }}</td>
            <td>{{ employee.emp_tel }}</td>
            <td>{{ employee.emp_adresse }}</td>
            <td>
              <button @click="editEmployee(employee)" class="btn btn-edit">
                Modifier
              </button>
              <button @click="deleteEmployee(employee.emp_im)" class="btn btn-delete">
                Supprimer
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination modifiée -->
      <div class="pagination" v-if="totalEmployees > 0">
        <button 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
          class="btn btn-secondary"
        >
          Précédent
        </button>
        <div class="page-numbers">
          <button 
            v-for="page in displayedPages" 
            :key="page"
            @click="changePage(page)"
            :class="['btn', 'btn-page', currentPage === page ? 'btn-active' : '']"
          >
            {{ page }}
          </button>
        </div>
        <button 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
          class="btn btn-secondary"
        >
          Suivant
        </button>
      </div>
    </div>

    <!-- Modal d'ajout/modification -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Modifier' : 'Ajouter' }} un employé</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="employee-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="emp_im">IM</label>
              <input
                id="emp_im"
                v-model="formData.emp_im"
                type="text"
                class="form-control"
                :disabled="isEditing"
              />
            </div>

            <div class="form-group">
              <label for="emp_nom_prenom">Nom et Prénom</label>
              <input
                id="emp_nom_prenom"
                v-model="formData.emp_nom_prenom"
                type="text"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="date_naiss">Date de naissance</label>
              <input
                id="date_naiss"
                v-model="formData.date_naiss"
                type="date"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="sexe">Sexe</label>
              <select
                id="sexe"
                v-model="formData.sexe"
                class="form-control"
                required
              >
                <option value="">Sélectionner le sexe</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>

            <div class="form-group">
              <label for="emp_fonction">Fonction</label>
              <input
                id="emp_fonction"
                v-model="formData.emp_fonction"
                type="text"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="emp_tel">Téléphone</label>
              <input
                id="emp_tel"
                v-model="formData.emp_tel"
                type="text"
                class="form-control"
                required
              />
            </div>

            <div class="form-group full-width">
              <label for="emp_adresse">Adresse</label>
              <input
                id="emp_adresse"
                v-model="formData.emp_adresse"
                type="text"
                class="form-control"
                required
              />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" class="btn btn-primary">
              {{ isEditing ? 'Modifier' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'EmployeeView',
  data() {
    return {
      showModal: false,
      isEditing: false,
      employeeList: [],
      totalEmployees: 0,
      currentPage: 1,
      limit: 8, // Modifié à 8 employés par page
      formData: {
        emp_im: '',
        emp_nom_prenom: '',
        date_naiss: '',
        sexe: '',
        emp_fonction: '',
        emp_tel: '',
        emp_adresse: '',
      },
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalEmployees / this.limit)
    },
    // Calcul des pages à afficher
    displayedPages() {
      const delta = 2
      const range = []
      const rangeWithDots = []
      let l

      for (let i = 1; i <= this.totalPages; i++) {
        if (
          i === 1 ||
          i === this.totalPages ||
          (i >= this.currentPage - delta && i <= this.currentPage + delta)
        ) {
          range.push(i)
        }
      }

      range.forEach(i => {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1)
          } else if (i - l !== 1) {
            rangeWithDots.push('...')
          }
        }
        rangeWithDots.push(i)
        l = i
      })

      return rangeWithDots
    }
  },
  created() {
    this.loadEmployees()
  },
  methods: {
    async loadEmployees() {
      try {
        const response = await axios.get(`http://localhost:4044/api/emp`, {
          params: {
            page: this.currentPage,
            limit: this.limit
          }
        })
        
        if (response.data.status) {
          this.employeeList = response.data.reponse
          this.totalEmployees = response.data.nb_total_employe
        } else {
          alert('Erreur lors du chargement des employés')
        }
      } catch (error) {
        console.error('Erreur lors du chargement des employés:', error)
        alert('Erreur lors du chargement des employés')
      }
    },
    async handleSubmit() {
      try {
        let response
        
        if (this.isEditing) {
          // Utilisation de PUT pour la modification
          response = await axios.put(
            `http://localhost:4044/api/emp/${this.formData.emp_im}`,
            this.formData
          )
        } else {
          // POST pour l'ajout
          response = await axios.post('http://localhost:4044/api/emp', this.formData)
        }

        if (response.data.status) {
          alert(`Employé ${this.isEditing ? 'modifié' : 'ajouté'} avec succès`)
          this.closeModal()
          this.loadEmployees()
        } else {
          alert(response.data.message || `Erreur lors de ${this.isEditing ? 'la modification' : "l'ajout"}`)
        }
      } catch (error) {
        console.error('Erreur:', error)
        alert(`Une erreur est survenue lors de ${this.isEditing ? 'la modification' : "l'ajout"}`)
      }
    },
    editEmployee(employee) {
      this.isEditing = true
      this.formData = { ...employee }
      this.showModal = true
    },
    async deleteEmployee(empId) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
        try {
          const response = await axios.delete(`http://localhost:4044/api/emp/${empId}`)
          if (response.data.status) {
            alert('Employé supprimé avec succès')
            if (this.employeeList.length === 1 && this.currentPage > 1) {
              this.currentPage--
            }
            this.loadEmployees()
          } else {
            alert(response.data.message)
          }
        } catch (error) {
          console.error('Erreur lors de la suppression:', error)
          alert('Erreur lors de la suppression')
        }
      }
    },
    changePage(page) {
      if (page !== '...') {
        this.currentPage = page
        this.loadEmployees()
      }
    },
    closeModal() {
      this.showModal = false
      this.isEditing = false
      this.resetForm()
    },
    resetForm() {
      this.formData = {
        emp_im: '',
        emp_nom_prenom: '',
        date_naiss: '',
        sexe: '',
        emp_fonction: '',
        emp_tel: '',
        emp_adresse: '',
      }
    },
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.employee-page {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-container {
  overflow-x: auto;
}

.employee-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.employee-table th,
.employee-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.employee-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.employee-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.employee-table tr:hover {
  background-color: #f5f5f5;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.btn-page {
  padding: 5px 10px;
  background-color: #fff;
  border: 1px solid #ddd;
}

.btn-active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-control {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-edit {
  background-color: #ffc107;
  margin-right: 5px;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

label {
  font-weight: bold;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>