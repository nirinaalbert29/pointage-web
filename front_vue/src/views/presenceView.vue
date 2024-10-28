<template>
    <div class="flex flex-col p-3">
        <div v-if="!this.$store.state.show_pres_hist" class="z-10 flex flex-col w-full h-full">
            <!-- Header Section -->
            <div class="flex justify-between w-full">
                <div class="flex">
                    <router-link to="/" class="px-2 transform group hover:scale-125">
                        <svg class="w-9" viewBox="0 0 24 24">
                            <path class="text-gray-600 fill-current group-hover:text-indigo-500" d="M15.41 16.58 10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.42z" />
                        </svg>
                    </router-link>
                    <div :class="this.$store.state.is_dark?'text-gray-50':'text-black'" class="ml-4 text-2xl">Presence</div>
                </div>

                <!-- Search Controls -->
                <div class="flex flex-row space-x-4">
                    <div class="flex items-center">
                        <input type="date" 
                               v-model="searchDate" 
                               @input="handleSearch" 
                               class="px-3 py-1 border border-gray-400 rounded-lg">
                    </div>
                    
                    <div class="flex space-x-2">
                        <input v-model="searchImmatricule" 
                               @input="handleSearch" 
                               type="text" 
                               placeholder="Immatricule" 
                               class="px-3 py-1 border border-gray-400 rounded-lg">
                        <input v-model="searchPresenceId" 
                               @input="handleSearch" 
                               type="text" 
                               placeholder="ID Presence" 
                               class="px-3 py-1 border border-gray-400 rounded-lg">
                        <input v-model="searchStatus" 
                               @input="handleSearch" 
                               type="text" 
                               placeholder="Status" 
                               class="px-3 py-1 border border-gray-400 rounded-lg">
                    </div>
    
                    <router-link to="/scanQRCode" 
                                class="flex flex-row items-center px-3 transform bg-indigo-500 hover:scale-110 rounded-2xl">
                        <svg class="w-7" viewBox="0 0 24 24">
                            <path class="text-white fill-current" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                        <span class="text-sm text-white">Faire nouveau pointage</span>
                    </router-link>
                </div>
            </div>
    
            <!-- Presence List Section -->
            <div class="w-full h-full mt-5">
                <div class="flex w-full h-full">
                    <!-- Empty State -->
                    <div v-if="!hasPresenceData || filteredPresence.length === 0" 
                         class="flex flex-col items-center justify-center w-full h-full">
                        <svg class="w-14" viewBox="0 0 24 24">
                            <path d="M3 5v14h17V5H3m4 2v2H5V7h2m-2 6v-2h2v2H5m0 2h2v2H5v-2m13 2H9v-2h9v2m0-4H9v-2h9v2m0-4H9V7h9v2z" />
                        </svg>
                        <span class="text-xl">La liste est vide</span>
                    </div>

                    <!-- Presence Cards Grid -->
                    <div v-else class="flex w-full h-full">
                        <div class="grid w-full grid-cols-2 gap-4 overflow-auto sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                            <div v-for="item in filteredPresence" 
                                 :key="item.id_pres" 
                                 class="relative flex flex-col w-64 h-64 px-3 my-2 border border-gray-500 rounded-lg">
                                
                                <!-- Time Badge -->
                                <div class="absolute px-2 py-1 bg-gray-100 rounded-lg right-2 top-2">
                                    <span class="text-sm font-medium text-gray-700" 
                                          v-text="formatTimeDisplay(item.pres_heure_enreg)"></span>
                                </div>
                                
                                <!-- Avatar Section -->
                                <div class="flex justify-center w-full mt-8">
                                    <svg class="w-28" viewBox="0 0 24 24">
                                        <path class="text-gray-500 fill-current" 
                                              d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z" />
                                    </svg>
                                </div>

                                <!-- User Info Section -->
                                <div class="flex flex-col space-y-1">
                                    <div class="flex items-center">
                                        <span v-text="initialOf(item.emp_nom_prenom)" 
                                              class="px-2 font-bold text-white uppercase bg-indigo-500 rounded-xl"></span>
                                        <div class="flex flex-col ml-1">
                                            <span class="text-xs font-bold text-indigo-500" 
                                                  v-text="'IM: ' + item.im_emp"></span>
                                            <span class="text-xs text-gray-500" 
                                                  v-text="'ID: ' + item.id_pres"></span>
                                            <span :class="this.$store.state.is_dark?'text-gray-900':'text-gray-900'" 
                                                  class="text-sm font-bold" 
                                                  v-text="'Nom: ' + item.emp_nom_prenom"></span>
                                        </div>
                                    </div>

                                    <!-- Status and DateTime Section -->
                                    <div class="flex flex-col mt-2 space-y-2">
                                        <span class="text-sm font-semibold" 
                                              :class="getStatusColor(item.status_pres)"
                                              v-text="'Status: ' + item.status_pres"></span>
                                        
                                        <div class="flex flex-col">
                                            <span class="text-sm" 
                                                  :class="getStatusColor(item.status_pres)"
                                                  v-text="'Pointé le: ' + formatDateTime(item.pres_date_enreg)"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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
            searchDate: new Date().toISOString().substr(0, 10),
            searchImmatricule: '',
            searchPresenceId: '',
            searchStatus: '',
            searchTimeout: null,
            currentFilters: {
                date: null,
                immatricule: null,
                presenceId: null,
                status: null
            }
        }
    },

    computed: {
        hasPresenceData() {
            return this.$store.state.liste_presence && Array.isArray(this.$store.state.liste_presence);
        },

        filteredPresence() {
            if (!this.hasPresenceData) {
                return [];
            }

            let filtered = [...this.$store.state.liste_presence];

            try {
                // Filter by date
                if (this.searchDate) {
                    filtered = filtered.filter(item => 
                        item && item.pres_date_enreg && 
                        this.formatDateForComparison(item.pres_date_enreg) === this.searchDate
                    );
                }

                // Filter by immatricule
                if (this.searchImmatricule) {
                    filtered = filtered.filter(item =>
                        item && item.im_emp && 
                        item.im_emp.toString().toLowerCase().includes(this.searchImmatricule.toLowerCase())
                    );
                }

                // Filter by ID presence
                if (this.searchPresenceId) {
                    filtered = filtered.filter(item =>
                        item && item.id_pres && 
                        item.id_pres.toString().includes(this.searchPresenceId)
                    );
                }

                // Filter by status
                if (this.searchStatus) {
                    filtered = filtered.filter(item =>
                        item && item.status_pres && 
                        item.status_pres.toLowerCase().includes(this.searchStatus.toLowerCase())
                    );
                }

                return filtered.sort((a, b) => b.id_pres - a.id_pres);
            } catch (error) {
                console.error('Error in filteredPresence:', error);
                return [];
            }
        }
    },

    methods: {
        initialOf(val) {
            return val?.substring(0, 1) || '';
        },

        getStatusColor(status) {
            if (!status) return 'text-gray-500';
            const statusLower = status.toLowerCase();
            if (statusLower.includes('retard')) return 'text-yellow-500';
            if (statusLower.includes('absent')) return 'text-red-500';
            if (statusLower.includes('present')) return 'text-green-500';
            return 'text-gray-500';
        },

        formatDateTime(dateStr) {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                
                // Format the date components
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                
                // Return formatted string
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            } catch (error) {
                console.error('Error formatting datetime:', error);
                return dateStr;
            }
        },

        formatTimeDisplay(timeStr) {
            if (!timeStr) return '';
            try {
                const [hours, minutes, seconds] = timeStr.split(':');
                if (hours && minutes && seconds) {
                    return `${hours}:${minutes}:${seconds}`;
                }
                return timeStr;
            } catch (error) {
                console.error('Error formatting time:', error);
                return timeStr;
            }
        },

        formatDateForComparison(dateStr) {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return date.toISOString().split('T')[0];
            } catch (error) {
                console.error('Error formatting date for comparison:', error);
                return '';
            }
        },

        handleSearch() {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            this.searchTimeout = setTimeout(() => {
                const hasChanges = 
                    this.currentFilters.date !== this.searchDate ||
                    this.currentFilters.immatricule !== this.searchImmatricule ||
                    this.currentFilters.presenceId !== this.searchPresenceId ||
                    this.currentFilters.status !== this.searchStatus;

                if (hasChanges) {
                    this.findPresence();
                    this.updateCurrentFilters();
                }
            }, 300);
        },

        updateCurrentFilters() {
            this.currentFilters = {
                date: this.searchDate,
                immatricule: this.searchImmatricule,
                presenceId: this.searchPresenceId,
                status: this.searchStatus
            };
        },

        findPresence() {
            this.$store.commit('find', {
                url: 'api/presencee',
                type_var: 'presence',
                immatricule: this.searchImmatricule || undefined,
                presence_id: this.searchPresenceId || undefined,
                status: this.searchStatus || undefined,
                date: this.searchDate || undefined
            });
        },

        async initializeData() {
            try {
                await this.findPresence();
                this.updateCurrentFilters();
            } catch (error) {
                console.error('Error initializing data:', error);
            }
        }
    },

    mounted() {
        this.initializeData();
    }
}
</script>