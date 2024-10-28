const db = require('../models/data');

class DashboardController {
    static async getStats(req, res) {
        try {
            const { employee, year, month } = req.query;
            
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            
            let params = [startDate, endDate];
            let employeeFilter = '';
            
            if (employee && employee !== 'all') {
                employeeFilter = 'AND e.emp_im = ?';
                params.push(employee);
            }

            const [presenceStats, absenceStats, congeStats] = await Promise.all([
                db.exec_params(`
                    SELECT 
                        COUNT(DISTINCT e.emp_im) as totalEmployees,
                        COUNT(CASE WHEN p.status_pres = 'present' THEN 1 END) as totalPresent,
                        COUNT(CASE WHEN p.status_pres = 'retard' THEN 1 END) as totalRetards,
                        SUM(CASE WHEN p.status_pres = 'retard' THEN TIME_TO_SEC(TIMEDIFF(p.heure_arrive, '08:00:00'))/3600 ELSE 0 END) as totalDelayHours
                    FROM employe e
                    LEFT JOIN presence p ON e.emp_im = p.im_emp 
                        AND DATE(p.pres_date_enreg) BETWEEN DATE(?) AND DATE(?)
                    WHERE 1=1 ${employeeFilter}
                `, params),

                db.exec_params(`
                    SELECT 
                        COUNT(DISTINCT a.im_emp) as totalAbsent,
                        SUM(a.nb_jours) as totalJoursAbsence
                    FROM absence a
                    WHERE DATE(a.date_debut) <= DATE(?) 
                    AND DATE(a.date_fin) >= DATE(?) 
                    ${employeeFilter}
                `, params),

                db.exec_params(`
                    SELECT 
                        COUNT(DISTINCT c.im_emp) as totalEnConge,
                        SUM(c.nbr_jour) as totalJoursConge
                    FROM conge c
                    WHERE c.etat_conge = 'accepté'
                    AND DATE(c.conge_date_enreg) BETWEEN DATE(?) AND DATE(?)
                    ${employeeFilter}
                `, params)
            ]);

            res.json({
                status: true,
                data: {
                    totalEmployees: presenceStats[0].totalEmployees || 0,
                    totalPresent: presenceStats[0].totalPresent || 0,
                    totalAbsent: absenceStats[0].totalAbsent || 0,
                    totalRetards: presenceStats[0].totalRetards || 0,
                    totalDelayHours: Math.round(presenceStats[0].totalDelayHours || 0),
                    totalJoursAbsence: absenceStats[0].totalJoursAbsence || 0,
                    totalEnConge: congeStats[0].totalEnConge || 0,
                    totalJoursConge: congeStats[0].totalJoursConge || 0
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                status: false,
                message: "Erreur lors de la récupération des statistiques"
            });
        }
    }

    static async getPresenceHistory(req, res) {
        try {
            const { emp_im, start_date, end_date } = req.query;

            let query = `
                SELECT 
                    p.id_pres,
                    p.im_emp,
                    e.emp_nom_prenom,
                    p.status_pres,
                    p.pres_date_enreg,
                    p.heure_arrive
                FROM presence p
                JOIN employe e ON p.im_emp = e.emp_im
                WHERE p.pres_date_enreg BETWEEN ? AND ?
            `;
            
            const params = [start_date, end_date];

            if (emp_im && emp_im !== 'all') {
                query += ' AND p.im_emp = ?';
                params.push(emp_im);
            }

            query += ' ORDER BY p.pres_date_enreg DESC';

            const history = await db.exec_params(query, params);

            res.json({
                status: true,
                data: history
            });
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            res.status(500).json({
                status: false,
                message: "Erreur lors de la récupération de l'historique"
            });
        }
    }



    ///////////////old
    //Récupération des détails des employes
    static async getDetailsUser(req, res) {
        try {

            let { id } = req.params

            //Récupération d'un simple employe
            let user = (await D.exec_params('select * from employe where emp_im = ?', id))[0]

            //Récupération accès modules
            let user_access = await D.exec_params(`select * from module
            left join util_access on module_id = ua_module_id 
            left join employe on emp_im = ?`, id)



            //à venir : récupération des historiques de l'employe
            let module_list = await D.exec('select * from module')


            // console.log(user);

            return res.send({ status: true, user, user_access, module_list })

        } catch (e) {
            console.error(e)
            return res.send({ status: false, message: "Erreur dans la base de donnée" })
        }
    }

    static async getList(req, res) {
        try {
            //A reserver recherche par nom_prenom
            let pres_ = await D.exec_params(`select * from presence where pres_date_enreg=?`, [req.body.date_])
                //Liste total des employe
            let en_conge = await D.exec_params(`select * from conge`, [req.body.date_])
                //Liste total des employe
            let nb_male = await D.exec_params(`select * from employe where sexe='M'`, [req.body.date_])
                //Liste total des employe
            let nb_total_employe = (await D.exec('select count(*) as nb from employe'))[0].nb

            return res.send({ status: true, pres_, nb_male, en_conge, nb_total_employe })
        } catch (e) {
            console.error(e)
            return res.send({ status: false, message: "Erreur dans la base de donnée" })
        }
    }
}

module.exports = DashboardController;