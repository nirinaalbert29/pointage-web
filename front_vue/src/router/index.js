import { createRouter, createWebHistory } from 'vue-router' 
import home from '../views/accueilView.vue'
import orgChart from '../views/orgchartView.vue'
import employee from '../views/employeeView.vue'
import presence from '../views/presenceView.vue'
import TableauDeBord from '../views/tableauDeBordView.vue'
import abscence from '../views/abscenceView.vue'  
import config from '../views/configuration/configurationView.vue'
import singIn from '../views/auth/signinView.vue'
import annuel from '../views/conge/annuelleView.vue'
import mat from '../views/conge/matePatView.vue'
import permission from '../views/conge/permissionView.vue'
import cam from '../views/appareilView.vue'
import CongeList from '@/views/conge/CongeList.vue'
import LoginView from '@/views/auth/loginView.vue'

const routes = [        
  {
    path: '/scanQRCode',
    name: 'cam',
    component: cam

  },     
  {
    path: '/',
    name: 'welcome',
    component: home

  },           
  {
    path: '/organigramme',
    name: 'organigramme',
    component: orgChart

  },          
  {
    path: '/employe',
    name: 'employee',
    component: employee
  },          
  {
    path: '/tableau',
    name: 'tableau',
    component: TableauDeBord

  },          
  {
    path: '/presence',
    name: 'presence',
    component: presence

  },          
  {
    path: '/abscence',
    name: 'abscence',
    component: abscence

  },              
  {
    path: '/config',
    name: 'config',
    component: config
  },             
  {
    path: '/inscription',
    name: 'inscription',
    component: singIn
  }, 
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },             
  {
    path: '/annuel',
    name: 'annuel',
    component: annuel

  },             
  {
    path: '/mat',
    name: 'mat',
    component: mat

  },             
  {
    path: '/permission',
    name: 'permission',
    component: permission

  },   
  {
    path: '/conges',
    name: 'Conges',
    component: CongeList,
    meta: {
      title: 'Gestion des congés',
      requiresAuth: true // Si vous avez une authentification
    }
  } 
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
