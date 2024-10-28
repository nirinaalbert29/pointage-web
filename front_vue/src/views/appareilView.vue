<template>
  <div class="flex flex-col w-full h-full bg-stone-900">
    <div class="flex flex-row w-full h-full mb-4">
      <div class="w-[30vw] h-full">
          <router-link to="/presence" class="px-2 transform group hover:scale-125">
                <svg class=" w-9" viewBox="0 0 24 24">
                    <path class="text-gray-600 fill-current group-hover:text-indigo-500" d="M15.41 16.58 10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.42z" /></svg>
          </router-link>
        <div class="flex flex-col px-10 mt-12">
          <!-- Zone de scan -->
          <div class="relative">
            <video 
              ref="video" 
              width="300" 
              height="300" 
              autoplay
              class="border-2 border-indigo-500 rounded-lg"
            ></video>
            <div v-if="isScanning" class="absolute top-0 left-0 w-full h-full">
              <div class="scanning-line"></div>
            </div>
            <canvas ref="canvas" style="display: none;"></canvas>
          </div>
          
          <!-- Boutons de contrôle -->
          <div class="flex gap-2 mt-4">
            <button 
              @click="toggleScanning" 
              class="px-4 py-2 font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              {{ isScanning ? 'Arrêter' : 'Démarrer' }} le scan
            </button>
            <button 
              @click="switchCamera" 
              class="px-4 py-2 font-bold text-white bg-gray-600 rounded hover:bg-gray-700"
            >
              Changer de caméra
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import jsQR from "jsqr";
import axios from 'axios';
import Swal from 'sweetalert2';

export default {
  name: 'QrPresenceScanner',
  
  data() {
    return {
      isScanning: false,
      currentStream: null,
      currentCamera: 'environment',
      scanInterval: null,
      lastScannedCode: null,
      baseUrl: 'http://localhost:4044'
    };
  },

  methods: {
    async initCamera() {
      if (this.currentStream) {
        this.stopVideo();
      }

      const constraints = {
        video: { 
          facingMode: this.currentCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      try {
        this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        this.$refs.video.srcObject = this.currentStream;
        await new Promise(resolve => this.$refs.video.onloadedmetadata = resolve);
        this.$refs.video.play();
        this.startScanning();
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur d\'accès à la caméra. Vérifiez les permissions.',
          showConfirmButton: false,
          timer: 3000
        });
      }
    },

    stopVideo() {
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
      }
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
      }
      this.isScanning = false;
    },

    async switchCamera() {
      this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
      await this.initCamera();
    },

    toggleScanning() {
      if (this.isScanning) {
        this.stopScanning();
      } else {
        this.startScanning();
      }
    },

    startScanning() {
      this.isScanning = true;
      this.scanInterval = setInterval(() => this.scan(), 100);
    },

    stopScanning() {
      this.isScanning = false;
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
      }
    },

    async scan() {
      if (!this.isScanning) return;

      const video = this.$refs.video;
      const canvas = this.$refs.canvas;
      const context = canvas.getContext("2d");

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code && code.data !== this.lastScannedCode) {
            this.lastScannedCode = code.data;
            console.log("QR Code détecté:", code.data);
            this.stopScanning();
            await this.handleSuccessfulScan(code.data);
          }
        } catch (error) {
          console.error("Erreur lors du scan:", error);
        }
      }
    },

    async handleSuccessfulScan(codeData) {
    let loadingAlert;
    try {
        let empId = null;
        
        // Extraction de l'ID employé du QR code
        if (/^\d+$/.test(codeData.trim())) {
            empId = codeData.trim();
        } else {
            try {
                const data = JSON.parse(codeData);
                empId = data.emp_im;
            } catch (e) {
                const matches = codeData.match(/\d+/);
                if (matches) {
                    empId = matches[0];
                }
            }
        }

        if (!empId) {
            throw new Error('QR code invalide : ID employé non trouvé');
        }

        // Afficher le loading
        loadingAlert = Swal.fire({
            title: 'Vérification...',
            text: 'Veuillez patienter',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Vérifier l'employé avec la nouvelle route
        const response = await axios.get(`${this.baseUrl}/api/employee/verify/${empId}`);
        
        if (loadingAlert) {
            loadingAlert.close();
        }

        if (!response.data.status) {
            throw new Error(response.data.message);
        }

        const employeeData = response.data.data;
        const canRegister = employeeData.canRegisterPresence;

        // Afficher les informations de l'employé
        const result = await Swal.fire({
            title: 'Information Employé',
            html: `
                <div class="text-left p-4">
                    <div class="mb-4 ${canRegister ? 'text-green-600' : 'text-red-600'} text-center font-bold">
                        ${canRegister ? 'Pointage disponible' : 'Pointage déjà effectué'}
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="font-semibold">ID:</div>
                        <div>${employeeData.employee.emp_im}</div>
                        
                        <div class="font-semibold">Nom:</div>
                        <div>${employeeData.employee.emp_nom_prenom}</div>
                        
                        <div class="font-semibold">Fonction:</div>
                        <div>${employeeData.employee.emp_fonction}</div>
                        
                        <div class="font-semibold">Dernier statut:</div>
                        <div>${employeeData.employee.last_status || 'Aucun'}</div>
                    </div>
                </div>
            `,
            // showCancelButton: true,
            confirmButtonText: canRegister ? 'Enregistrer présence' : 'Fermer',
            confirmButtonColor: canRegister ? '#4CAF50' : '#f44336',
            cancelButtonText: 'Fermer',
            showCancelButton: !canRegister,
            allowOutsideClick: false
        });

        if (result.isConfirmed && canRegister) {
            const presenceResult = await axios.post(`${this.baseUrl}/api/presence`, {
                emp_im: empId
            });

            await Swal.fire({
                icon: 'success',
                title: 'Présence enregistrée',
                text: `Statut: ${presenceResult.data.data.status_pres}`,
                showConfirmButton: false,
                timer: 3000
            });
        }

    } catch (error) {
        if (loadingAlert) {
            loadingAlert.close();
        }

        let errorMessage = 'Une erreur est survenue';
        if (error.response) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: errorMessage,
            confirmButtonColor: '#f44336'
        });
    } finally {
        this.lastScannedCode = null;
        this.startScanning();
    }
}
  },

  mounted() {
    this.initCamera();
  },

  beforeUnmount() {
    this.stopVideo();
  }
};
</script>

<style scoped>
.scanning-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #4f46e5;
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% {
    top: 0;
  }
  100% {
    top: 100%;
  }
}
</style>