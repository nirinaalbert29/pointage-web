<template>
    <div class="flex flex-row px-5 items-center justify-between w-full h-full">
        <div class="flex flex-col w-full items-center">
            <span class="text-red-500">Ministere du Travail,de l'Emploi et de la Fonction Publique</span>
            <span class="text-3xl font-bold text-green-500">Gestion de pointage du personnel</span>
            <span>Développer par Hery</span>
        </div>
        <div class="flex flex-col w-full items-start">
            <div class="flex flex-col clear-left py-4 px-5 rounded-xl">
                <!-- Message d'erreur -->
                <div v-if="showError" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <span class="block sm:inline">{{ errorMessage }}</span>
                </div>

                <span class="text-4xl mb-6">Connexion</span>
                <div class="border border-gray-300 rounded-lg px-2 flex flex-row">
                    <svg class="w-5" viewBox="0 0 24 24">
                        <path class="fill-current text-gray-400" d="m20 8-8 5-8-5V6l8 5 8-5m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    </svg>
                    <input v-model="credentials.email" type="text" placeholder="N° téléphone ou email" class="bg-transparent outline-none ml-2 py-1">
                </div>

                <div class="border border-gray-300 rounded-lg px-2 flex flex-row mt-4">
                    <svg class="w-5" viewBox="0 0 24 24">
                        <path class="fill-current text-gray-400" d="M17 7h5v10h-5v2a1 1 0 0 0 1 1h2v2h-2.5c-.55 0-1.5-.45-1.5-1 0 .55-.95 1-1.5 1H12v-2h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2V2h2.5c.55 0 1.5.45 1.5 1 0-.55.95-1 1.5-1H20v2h-2a1 1 0 0 0-1 1v2M2 7h11v2H4v6h9v2H2V7m18 8V9h-3v6h3M8.5 12A1.5 1.5 0 0 0 7 10.5 1.5 1.5 0 0 0 5.5 12 1.5 1.5 0 0 0 7 13.5 1.5 1.5 0 0 0 8.5 12m4.5-1.11c-.61-.56-1.56-.51-2.12.11-.56.6-.51 1.55.12 2.11.55.52 1.43.52 2 0v-2.22z" />
                    </svg>
                    <input v-model="credentials.password" :type="hidden ? 'password' : 'text'" placeholder="Mot de passe" class="bg-transparent outline-none ml-2 py-1">
                    <svg @click="cheked(false)" v-if="hidden" class="w-5 cursor-pointer" viewBox="0 0 24 24">
                        <path class="fill-current text-gray-400" d="M12 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z" />
                    </svg>
                    <svg v-else @click="cheked(true)" class="w-5 cursor-pointer" viewBox="0 0 24 24">
                        <path class="fill-current text-gray-400" d="M11.83 9 15 12.16V12a3 3 0 0 0-3-3h-.17m-4.3.8 1.55 1.55c-.05.21-.08.42-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2M2 4.27l2.28 2.28.45.45C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.43.42L19.73 22 21 20.73 3.27 3M12 7a5 5 0 0 1 5 5c0 .64-.13 1.26-.36 1.82l2.93 2.93c1.5-1.25 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-4 .7l2.17 2.15C10.74 7.13 11.35 7 12 7z" />
                    </svg>
                </div>

                <!-- Boutons -->
                <div class="flex flex-col space-y-3 mt-4">
                    <!-- Bouton Connexion -->
                    <div class="rounded-lg px-2 bg-green-500 flex flex-row border border-green-500">
                        <button @click="login" 
                                class="text-white text-xl w-full rounded-lg py-2"
                                :disabled="!isFormValid">
                            Connexion
                        </button>
                    </div>

                    <!-- Bouton Inscription -->
                    <div class="rounded-lg px-2 border border-gray-400">
                        <router-link to="/inscription" class="flex text-gray-400 text-xl w-full rounded-lg items-center justify-center py-2">
                            <svg class="w-5 mr-2" viewBox="0 0 24 24">
                                <path class="fill-current text-gray-400" d="M15 4a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0-4-4m0 1.9a2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1M15 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4m0 1.9c2.97 0 6.1 1.46 6.1 2.1v.1H8.9v-.1c0-.64 3.13-2.1 6.1-2.1M1 10v2h8v-2H1m2-4v2h6V6H3m-2 8v2h8v-2H1z"/>
                            </svg>
                            <span>S'inscrire</span>
                        </router-link>
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
            hidden: true,
            showError: false,
            errorMessage: '',
            credentials: {
                email: '',
                password: ''
            }
        }
    },
    computed: {
        isFormValid() {
            return this.credentials.email && this.credentials.password;
        }
    },
    methods: {
        cheked(val) {
            this.hidden = val
        },
        async login() {
            if (!this.isFormValid) return;

            try {
                const response = await this.$http.post('api/log_user', {
                    util_email: this.credentials.email,
                    util_pass: this.credentials.password
                });

                if (response.data.status) {
                    const userData = response.data.data[0]; // Récupérer le premier élément du tableau data
            
                    // Stocker les informations de l'utilisateur dans le store
                    this.$store.commit('setUser', userData);
                    // Stockez l'ID dans le localStorage
                    localStorage.setItem('userId', userData.util_id);

                    // Redirigez vers le tableau de bord
                    this.$router.push('/');
                } else {
                    this.showError = true;
                    this.errorMessage = response.data.message;
                }
            } catch (error) {
                console.error(error);
                this.showError = true;
                this.errorMessage = "Erreur lors de la connexion";
            }
        }
    }
}
</script>