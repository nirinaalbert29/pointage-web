let utils = require('../utils/utils');
let D = require('../models/data');

class Absence {
    static async checkEmploye(req, res) {
        try {
            const { im_emp } = req.params;
            const employe = await D.exec_params('SELECT * FROM employe WHERE emp_im = ?', [im_emp]);
            
            return res.send({
                status: true,
                employe: employe[0] || null
            });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Erreur lors de la vérification de l'employé"
            });
        }
    }

    static async register(req, res) {
        try {
            const _d = req.body;

            // Vérifier si l'employé existe
            const employe = await D.exec_params('SELECT * FROM employe WHERE emp_im = ?', [_d.im_emp]);
            if (!employe.length) {
                return res.send({
                    status: false,
                    message: "L'employé n'existe pas"
                });
            }

            // Vérifier si le nombre de jours ne dépasse pas 3
            if (parseInt(_d.nb_jours) > 3) {
                return res.send({
                    status: false,
                    message: "Le nombre de jours ne peut pas dépasser 3 jours"
                });
            }

            // Vérifier le total des absences
            const currentYear = new Date().getFullYear();
            const totalAbsences = await D.exec_params(`
                SELECT COALESCE(SUM(nb_jours), 0) as total
                FROM absence 
                WHERE im_emp = ? 
                AND YEAR(date_enregistre) = ?
            `, [_d.im_emp, currentYear]);

            const newTotal = totalAbsences[0].total + parseInt(_d.nb_jours);
            if (newTotal > 15) {
                return res.send({
                    status: false,
                    message: "Le nombre total de jours d'absence ne peut pas dépasser 15 jours par an"
                });
            }

            // Calculer la date de fin
            const dateDebut = new Date(_d.date_debut);
            const dateFin = new Date(dateDebut);
            dateFin.setDate(dateDebut.getDate() + parseInt(_d.nb_jours) - 1);

            const absenceData = {
                im_emp: _d.im_emp,
                motif: _d.motif,
                nb_jours: _d.nb_jours,
                date_debut: dateDebut,
                date_fin: dateFin,
                date_enregistre: new Date()
            };

            await D.set('absence', absenceData);
            return res.send({
                status: true,
                message: "Absence enregistrée avec succès"
            });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Erreur lors de l'enregistrement de l'absence"
            });
        }
    }

    static async update(req, res) {
        try {
            const { id_abs } = req.params;
            const updateData = req.body;

            // Vérifier si l'absence existe
            const existingAbsence = await D.exec_params('SELECT * FROM absence WHERE id_abs = ?', [id_abs]);
            if (!existingAbsence.length) {
                return res.send({
                    status: false,
                    message: "L'absence n'existe pas"
                });
            }

            // Vérifier si l'employé existe (si l'im_emp est modifié)
            if (updateData.im_emp && updateData.im_emp !== existingAbsence[0].im_emp) {
                const employe = await D.exec_params('SELECT * FROM employe WHERE emp_im = ?', [updateData.im_emp]);
                if (!employe.length) {
                    return res.send({
                        status: false,
                        message: "L'employé n'existe pas"
                    });
                }
            }

            // Vérifier si le nombre de jours ne dépasse pas 3
            if (parseInt(updateData.nb_jours) > 3) {
                return res.send({
                    status: false,
                    message: "Le nombre de jours ne peut pas dépasser 3 jours"
                });
            }

            // Préparer les données à mettre à jour
            const finalUpdateData = {
                im_emp: updateData.im_emp || existingAbsence[0].im_emp,
                motif: updateData.motif || existingAbsence[0].motif,
                nb_jours: updateData.nb_jours || existingAbsence[0].nb_jours,
                date_debut: updateData.date_debut || existingAbsence[0].date_debut
            };

            // Vérifier le total des jours d'absence si le nombre de jours ou l'employé change
            if (updateData.nb_jours || updateData.im_emp) {
                const currentYear = new Date().getFullYear();
                const totalAbsences = await D.exec_params(`
                    SELECT COALESCE(SUM(nb_jours), 0) as total
                    FROM absence 
                    WHERE im_emp = ? 
                    AND id_abs != ?
                    AND YEAR(date_enregistre) = ?
                `, [finalUpdateData.im_emp, id_abs, currentYear]);

                const newTotal = totalAbsences[0].total + parseInt(finalUpdateData.nb_jours);
                if (newTotal > 15) {
                    return res.send({
                        status: false,
                        message: "Le nombre total de jours d'absence ne peut pas dépasser 15 jours par an"
                    });
                }
            }

            // Calculer la nouvelle date de fin
            const dateDebut = new Date(finalUpdateData.date_debut);
            const dateFin = new Date(dateDebut);
            dateFin.setDate(dateDebut.getDate() + parseInt(finalUpdateData.nb_jours) - 1);

            // Mettre à jour l'absence
            const result = await D.exec_params(`
                UPDATE absence 
                SET 
                    im_emp = ?,
                    motif = ?,
                    nb_jours = ?,
                    date_debut = ?,
                    date_fin = ?
                WHERE id_abs = ?
            `, [
                finalUpdateData.im_emp,
                finalUpdateData.motif,
                finalUpdateData.nb_jours,
                dateDebut,
                dateFin,
                id_abs
            ]);

            if (result.affectedRows === 0) {
                return res.send({
                    status: false,
                    message: "Aucune modification n'a été effectuée"
                });
            }

            return res.send({
                status: true,
                message: "Absence mise à jour avec succès",
                data: {
                    ...finalUpdateData,
                    date_fin: dateFin
                }
            });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Erreur lors de la mise à jour de l'absence"
            });
        }
    }

    static async checkEmploye(req, res) {
        try {
            const { im_emp } = req.params;
            const employe = await D.exec_params('SELECT * FROM employe WHERE emp_im = ?', [im_emp]);
            
            return res.send({
                status: true,
                employe: employe[0] || null
            });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Erreur lors de la vérification de l'employé"
            });
        }
    }

    static async delete(req, res) {
        try {
            const { id_abs } = req.params;

            // Vérifier si l'absence existe
            const existingAbsence = await D.exec_params('SELECT * FROM absence WHERE id_abs = ?', [id_abs]);
            if (!existingAbsence.length) {
                return res.send({
                    status: false,
                    message: "L'absence n'existe pas"
                });
            }

            // Supprimer l'absence
            await D.exec_params('DELETE FROM absence WHERE id_abs = ?', [id_abs]);

            return res.send({
                status: true,
                message: "Absence supprimée avec succès"
            });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Erreur lors de la suppression de l'absence"
            });
        }
    }

    static async find_all_absence(req, res) {
        try {
            const absences = await D.exec_params(`
                SELECT a.*, e.emp_nom_prenom 
                FROM absence a
                LEFT JOIN employe e ON e.emp_im = a.im_emp
                ORDER BY a.date_enregistre DESC
            `);

            return res.send({
                status: true,
                reponse: absences
            });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Erreur lors de la récupération des absences"
            });
        }
    }

    static async getTotalAbsences(req, res) {
        try {
            const { im_emp } = req.params;
            const currentYear = new Date().getFullYear();
            
            // Vérifier si l'employé existe
            const employe = await D.exec_params('SELECT * FROM employe WHERE emp_im = ?', [im_emp]);
            if (!employe.length) {
                return res.send({
                    status: false,
                    message: "L'employé n'existe pas"
                });
            }

            // Calculer le total des jours d'absence pour l'année en cours
            const result = await D.exec_params(`
                SELECT COALESCE(SUM(nb_jours), 0) as total
                FROM absence 
                WHERE im_emp = ? 
                AND YEAR(date_enregistre) = ?
            `, [im_emp, currentYear]);
            
            return res.send({ 
                status: true, 
                total: result[0].total 
            });
        } catch (e) {
            console.error(e);
            return res.send({ 
                status: false, 
                message: "Erreur lors du calcul du total des absences" 
            });
        }
    }


    
    static async findList(req, res) {

        // let find_val =req.body.find
        let filters = req.query
        let _obj_pat = {
            id_pres: 'id_pres',
            util_label: 'emp_nom_prenom',
        }
        let default_sort_by = 'id_pres'
        console.log(req.body);

        filters.page = (!filters.page) ? 1 : parseInt(filters.page)
        filters.limit = (!filters.limit) ? 100 : parseInt(filters.limit)
        filters.sort_by = (!filters.sort_by) ? _obj_pat[default_sort_by] : _obj_pat[filters.sort_by]

        try {
            let reponse = await D.exec_params(`select presence.*, employe.* 
            from  
            presence left join employe on employe.emp_im!=presence.im_emp where 
            employe.emp_nom_prenom like ?  and  presence.pres_date_enreg=? and presence.statut_pres=?   order by ${filters.sort_by} limit ? offset ? `, [
                    '%' + req.body.find + '%',
                    req.body.date_,
                    req.body.day_type,
                    filters.limit,
                    (filters.page - 1) * filters.limit
                ])
                //Liste total des presence
            let nb_total_presence = (await D.exec('select count(*) as nb from presence'))[0].nb
            console.log(reponse);
            return res.send({ status: true, reponse, nb_total_presence })
        } catch (e) {
            console.error(e)
            return res.send({ status: false, message: "Erreur dans la base de donnée" })
        }
    }
}

module.exports = Absence;