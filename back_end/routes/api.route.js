const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Controllers
const EmployeController = require('../controller/employe.controller');
const UtilisateurController = require('../controller/utilisateur.controller');
const PresenceController = require('../controller/PresenceController');
const AbsenceController = require('../controller/absenceController');
const DashboardController = require('../controller/DashboardController');
const Conge = require('../controller/conge.controller');

// Middleware d'authentification pour toutes les routes
router.use(auth);

// Route de vérification API
router.get('/', (req, res) => {
    res.send({ message: "API 1.0 Fonctionnel" });
});

// Routes Utilisateurs
router.post('/users', UtilisateurController.register);
router.get('/users', UtilisateurController.getList);
router.post('/dec_user', UtilisateurController.setAccess);
router.post('/log_user', UtilisateurController.setLogin);

// Routes Employés
router.post('/emp', EmployeController.register);
router.put('/emp/:emp_im', EmployeController.update);
router.delete('/emp/:emp_im', EmployeController.delete);
router.get('/emp', EmployeController.getList);
router.get('/emp_', EmployeController.getListDisp);
router.post('/emps', EmployeController.findList);
router.get('/user/:emp_im', EmployeController.getUser);
// router.get('/api/employees', EmployeController.getAll);
// router.get('/api/dashboard/employee/:emp_im/stats', EmployeController.getDetailedStats);

// Routes Présences
// router.post('/presence', PresenceController.register);
// Routes Présences
router.post('/presence', PresenceController.register);
router.delete('/presence/:id_pres', PresenceController.delete);
router.get('/presence', PresenceController.getList);
router.get('/presence_days', PresenceController.getDays);
router.post('/presencee', PresenceController.findList);
router.get('/presence/dernier/:emp_im', PresenceController.getDernier);

// Routes Absences
router.get('/employe/:im_emp', AbsenceController.checkEmploye);
router.get('/absenceList', AbsenceController.find_all_absence);
router.get('/absence/total/:im_emp', AbsenceController.getTotalAbsences);
router.post('/absence', AbsenceController.register);
router.put('/absence/:id_abs', AbsenceController.update);
router.delete('/absence/:id_abs', AbsenceController.delete);

// Routes Dashboard
router.get('/api/dashboard/stats', DashboardController.getStats);
router.get('/api/dashboard/presence/history', DashboardController.getPresenceHistory);

// Routes pour les congés
router.get('/congeList', Conge.find_all_conge);
router.get('/employe/:id', Conge.checkEmploye);
router.get('/conge/total/:id', Conge.getTotalConges);
router.post('/conge', Conge.register);
router.put('/conge/:id', Conge.update);
router.delete('/conge/:id', Conge.delete);

module.exports = router;