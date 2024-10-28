<template>
    <div class="flex flex-col px-3 py-1">
        <div class="flex">
            <router-link to="/" class="px-2 group transform hover:scale-125">
                <svg class="w-9" viewBox="0 0 24 24">
                    <path class="group-hover:text-indigo-500 fill-current text-gray-600" d="M15.41 16.58 10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.42z" />
                </svg>
            </router-link>
            <div>
                <span class="text-indigo-500 font-bold">Panneau de Configuration</span>
            </div>
        </div>
        <div class="flex w-full px-14 flex-col mt-10">
            <div class="mt-5 w-full border-b border-gray-300">
                <div class="flex flex-col">
                    <span class="text-gray-500 text-2xl">Utilisateur</span>
                </div>
            </div>
    
            <div class="flex flex-row mt-2">
                <div class="rounded-full bg-indigo-500 p-4">
                    <svg class="w-16" viewBox="0 0 24 24">
                        <path class="fill-current text-white" d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z" />
                    </svg>
                </div>
                <div class="flex flex-col ml-4">
                    <span class="text-gray-700">Information utilisateur</span>
                    <div class="flex flex-row items-center">
                        <svg @click="openModal" class="w-6 cursor-pointer" viewBox="0 0 24 24">
                            <path class="fill-current text-gray-700" d="M20.71 7.04c-.34.34-.67.67-.68 1-.03.32.31.65.63.96.48.5.95.95.93 1.44-.02.49-.53 1-1.04 1.5l-4.13 4.14L15 14.66l4.25-4.24-.96-.96-1.42 1.41-3.75-3.75 3.84-3.83c.39-.39 1.04-.39 1.41 0l2.34 2.34c.39.37.39 1.02 0 1.41M3 17.25l9.56-9.57 3.75 3.75L6.75 21H3v-3.75z" />
                        </svg>
                        <span class="text-gray-700 font-semibold text-2xl" v-text="userData.util_name"></span>
                    </div>
                    <div>
                        <span class="text-indigo-500">{{ userData.util_email }}</span>
                    </div>
                </div>
            </div>
        </div>
    
        <!-- Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-8 rounded-lg w-96">
                <h2 class="text-2xl font-bold mb-4">Modifier l'utilisateur</h2>
                
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Nom</label>
                    <input v-model="editedUser.util_name" type="text" class="w-full px-3 py-2 border rounded">
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
                    <input v-model="editedUser.util_email" type="email" class="w-full px-3 py-2 border rounded">
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Mot de passe</label>
                    <input v-model="editedUser.util_pass" type="password" class="w-full px-3 py-2 border rounded">
                </div>
    
                <div class="flex justify-end space-x-2">
                    <button @click="closeModal" class="px-4 py-2 bg-gray-300 rounded">Annuler</button>
                    <button @click="updateUser" class="px-4 py-2 bg-indigo-500 text-white rounded">Enregistrer</button>
                </div>
            </div>
        </div>
    </div>
    </template>
    
    <script>
    export default {
        data() {
            return {
                userData: {
                    util_name: '',
                    util_email: '',
                    util_pass: ''
                },
                editedUser: {
                    util_name: '',
                    util_email: '',
                    util_pass: ''
                },
                showModal: false
            }
        },
        async created() {
            const userId = localStorage.getItem('userId');
            if (userId) {
                try {
                    const response = await this.$http.get(`api/user/${userId}`);
                    if (response.data.status) {
                        this.userData = response.data.data;
                    }
                } catch (error) {
                    console.error('Erreur lors de la récupération des données:', error);
                }
            }
        },
        methods: {
            openModal() {
                this.editedUser = { ...this.userData };
                this.showModal = true;
            },
            closeModal() {
                this.showModal = false;
            },
            async updateUser() {
                try {
                    const userId = localStorage.getItem('userId');
                    const response = await this.$http.put(`api/user/${userId}`, this.editedUser);
                    if (response.data.status) {
                        this.userData = response.data.data;
                        this.showModal = false;
                    }
                } catch (error) {
                    console.error('Erreur lors de la mise à jour:', error);
                }
            }
        }
    }
    </script>