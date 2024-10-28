<template>
    <div class="bg-stone-900 flex flex-col w-full h-full">
        <div class="flex justify-between w-full">
            <div class="flex flex-row w-60 rounded-xl justify-center mt-3 ml-3 items-center bg-indigo-600">
                <svg class="w-7" viewBox="0 0 24 24">
                    <path class="fill-current text-white" d="M10 4v4h4V4h-4m6 0v4h4V4h-4m0 6v4h4v-4h-4m0 6v4h4v-4h-4m-2 4v-4h-4v4h4m-6 0v-4H4v4h4m0-6v-4H4v4h4m0-6V4H4v4h4m2 6h4v-4h-4v4M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4c-1.08 0-2-.9-2-2V4a2 2 0 0 1 2-2z" />
                </svg>
                <span class="text-2xl text-white">Scanner Présence</span>
            </div>
            <div class="flex flex-row items-center text-white gap-4 mr-4">
                <router-link to="/scanQRCode" class="cursor-pointer">Appareil</router-link>
                <div @click="this.$store.state.decView=false" class="px-4 py-1 hover:scale-125 transform group cursor-pointer" title="Deconnectez ?">
                    <svg class="w-7" viewBox="0 0 24 24">
                        <path class="fill-current" :class="this.$store.state.is_dark?'text-white group-hover:text-red-600':'text-gray-700 group-hover:text-red-600'" d="m16.56 5.44-1.45 1.45A5.969 5.969 0 0 1 18 12a6 6 0 0 1-6 6 6 6 0 0 1-6-6c0-2.17 1.16-4.06 2.88-5.12L7.44 5.44A7.961 7.961 0 0 0 4 12a8 8 0 0 0 8 8 8 8 0 0 0 8-8c0-2.72-1.36-5.12-3.44-6.56M13 3h-2v10h2" />
                    </svg>
                </div>
            </div>
        </div>
        <div class="w-full flex flex-row h-full">
            <div class="w-[30vw] h-full border-r border-stone-400">
                <div class="flex px-10 mt-12">
                    <video ref="video" width="200" height="300" autoplay></video>
                    <canvas ref="canvas" style="display: none;"></canvas>
                </div>
                <div class="flex flex-col ml-10 mt-12 text-white space-y-4">
                    <div v-if="employeeInfo" class="bg-stone-800 p-4 rounded-lg">
                        <h3 class="text-lg font-bold mb-2">Information Employé</h3>
                        <div class="flex flex-col space-y-2">
                            <div class="flex justify-between">
                                <span class="font-medium">ID:</span>
                                <span>{{ employeeInfo.emp_im }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Nom:</span>
                                <span>{{ employeeInfo.emp_nom_prenom }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Fonction:</span>
                                <span>{{ employeeInfo.emp_fonction }}</span>
                            </div>
                        </div>
                        <button 
                            @click="fairePresence" 
                            class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
                            Faire Présence
                        </button>
                    </div>
                    <div v-if="lastStatus" :class="getStatusClass()" class="p-4 rounded-lg">
                        <h3 class="text-lg font-bold mb-2">Dernier Pointage</h3>
                        <p>Status: {{ lastStatus.status_pres }}</p>
                        <p>Heure: {{ formatTime(lastStatus.pres_date_enreg) }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import jsQR from "jsqr";
import axios from 'axios';

export default {
    data() {
        return {
            employeeInfo: null,
            lastStatus: null,
            scanning: false,
            error: null
        };
    },
    mounted() {
        this.startVideo();
    },
    methods: {
        startVideo() {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then(stream => {
                    this.$refs.video.srcObject = stream;
                    this.startScanning();
                })
                .catch(err => {
                    console.error("Erreur lors de l'accès à la caméra : ", err);
                    this.error = "Erreur d'accès à la caméra";
                });
        },
        startScanning() {
            this.scanning = true;
            this.scan();
        },
        scan() {
            if (!this.scanning) return;

            const video = this.$refs.video;
            const canvas = this.$refs.canvas;
            const context = canvas.getContext("2d");

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    try {
                        const data = JSON.parse(code.data);
                        if (data.emp_im) {
                            this.verifierEmploye(data.emp_im);
                        }
                    } catch (e) {
                        console.error("QR Code invalide", e);
                    }
                }
            }

            requestAnimationFrame(() => this.scan());
        },
        async verifierEmploye(empId) {
            try {
                const response = await axios.get(`/api/employe/${empId}`);
                this.employeeInfo = response.data;
                await this.verifierDernierPointage(empId);
            } catch (error) {
                console.error("Erreur lors de la vérification de l'employé", error);
                this.error = "Employé non trouvé";
            }
        },
        async verifierDernierPointage(empId) {
            try {
                const response = await axios.get(`/api/presence/dernier/${empId}`);
                this.lastStatus = response.data;
            } catch (error) {
                console.error("Erreur lors de la vérification du dernier pointage", error);
            }
        },
        async fairePresence() {
            if (!this.employeeInfo) return;

            try {
                const response = await axios.post('/api/presence', {
                    emp_im: this.employeeInfo.emp_im
                });
                
                this.lastStatus = response.data;
                // Afficher une notification de succès
                alert(`Présence enregistrée: ${response.data.status_pres}`);
            } catch (error) {
                console.error("Erreur lors de l'enregistrement de la présence", error);
                alert("Erreur lors de l'enregistrement de la présence");
            }
        },
        formatTime(date) {
            return new Date(date).toLocaleTimeString();
        },
        getStatusClass() {
            if (!this.lastStatus) return '';
            
            const status = this.lastStatus.status_pres;
            return {
                'bg-green-800': status === 'présent',
                'bg-yellow-800': status === 'retard',
                'bg-red-800': status === 'absent'
            };
        }
    }
};
</script>