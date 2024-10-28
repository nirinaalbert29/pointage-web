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
    console.log("Données du QR code brutes:", codeData);

    // Si codeData est déjà une chaîne numérique valide
    if (/^\d+$/.test(codeData.trim())) {
      empId = codeData.trim();
    } else {
      // Sinon, essayer de parser comme JSON
      try {
        const data = JSON.parse(codeData);
        empId = data.emp_im;
      } catch (e) {
        // Si ce n'est pas du JSON valide, chercher un nombre dans la chaîne
        const matches = codeData.match(/\d+/);
        if (matches) {
          empId = matches[0];
        }
      }
    }

    // Vérifier si empId est valide
    if (!empId) {
      throw new Error('QR code invalide : ID employé non trouvé');
    }

    console.log("ID employé validé:", empId);

    // Loading pendant la récupération des données
    loadingAlert = Swal.fire({
      title: 'Chargement...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Vérifier l'employé avec timeout
      const response = await Promise.race([
        axios.get(`${this.baseUrl}/api/user/${empId}`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Délai d\'attente dépassé')), 10000)
        )
      ]);

      console.log("Réponse API user:", response.data);
      
      if (!response.data || !response.data.user) {
        throw new Error(`Employé avec ID ${empId} non trouvé dans la base de données`);
      }

      const employeeInfo = response.data.user;

      // Fermer l'alerte de chargement
      if (loadingAlert) {
        loadingAlert.close();
      }

      // Récupérer le dernier pointage
      const presenceResponse = await axios.get(`${this.baseUrl}/api/presence/dernier/${empId}`);
      console.log("Réponse API présence:", presenceResponse.data);
      
      const lastPresence = presenceResponse.data.status ? presenceResponse.data.data : null;

      // Afficher les informations
      const result = await Swal.fire({
        title: 'Information Employé',
        html: `
          <div class="text-left">
            <p><strong>ID:</strong> ${employeeInfo.emp_im}</p>
            <p><strong>Nom:</strong> ${employeeInfo.emp_nom_prenom}</p>
            <p><strong>Fonction:</strong> ${employeeInfo.emp_fonction}</p>
            ${lastPresence ? `
              <p><strong>Dernier pointage:</strong> ${new Date(lastPresence.pres_date_enreg).toLocaleString()}</p>
              <p><strong>Statut:</strong> ${lastPresence.status_pres}</p>
            ` : '<p>Aucun pointage précédent</p>'}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Enregistrer présence',
        cancelButtonText: 'Fermer',
        allowOutsideClick: false
      });

      if (result.isConfirmed) {
        const presenceResult = await axios.post(`${this.baseUrl}/api/presence`, {
          emp_im: employeeInfo.emp_im
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
      // S'assurer que l'alerte de chargement est fermée
      if (loadingAlert) {
        loadingAlert.close();
      }

      // Déterminer le message d'erreur approprié
      let errorMessage;
      if (error.message === 'Délai d\'attente dépassé') {
        errorMessage = 'Le serveur ne répond pas. Vérifiez votre connexion et le serveur.';
      } else if (error.response) {
        errorMessage = `Erreur serveur: ${error.response.data?.message || error.message}`;
      } else if (error.request) {
        errorMessage = 'Impossible de communiquer avec le serveur. Vérifiez votre connexion.';
      } else {
        errorMessage = error.message;
      }

      console.error("Erreur complète:", error);
      
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
        showConfirmButton: true
      });
    }
  } catch (error) {
    // S'assurer que l'alerte de chargement est fermée
    if (loadingAlert) {
      loadingAlert.close();
    }

    console.error("Erreur complète:", error);
    await Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: error.message || 'Erreur lors du traitement du QR code',
      showConfirmButton: true
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