// conge.controller.js
let utils = require('../utils/utils');
let D = require('../models/data');

class Conge {
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

            // Vérifier le total des congés
            const currentYear = new Date().getFullYear();
            const totalConges = await D.exec_params(`
                SELECT COALESCE(SUM(nbr_jour), 0) as total
                FROM conge 
                WHERE im_emp = ? 
                AND YEAR(conge_date_enreg) = ?
                AND etat_conge = 1
            `, [_d.im_emp, currentYear]);

            const newTotal = totalConges[0].total + parseInt(_d.nbr_jour);
            if (newTotal > 30) {
                return res.send({
                    status: false,
                    message: "Le nombre total de jours de congés ne peut pas dépasser 30 jours par an"
                });
            }

            const congeData = {
                im_emp: _d.im_emp,
                type_conge: _d.type_conge,
                motif_conge: _d.motif_conge,
                nbr_jour: _d.nbr_jour,
                etat_conge: _d.etat_conge,
                conge_date_enreg: new Date()
            };

            await D.set('conge', congeData);
            return res.send({
                status: true,
                message: "Congé enregistré avec succès"
            });
        // Suite de conge.controller.js

    } catch (e) {
        console.error(e);
        return res.send({
            status: false,
            message: "Erreur lors de l'enregistrement du congé"
        });
    }
}

static async update(req, res) {
    try {
        const { id_conge } = req.params;
        const updateData = req.body;

        // 1. Vérifier si le congé existe et récupérer ses données actuelles
        const existingConge = await D.exec_params('SELECT * FROM conge WHERE id_conge = ?', [id_conge]);
        if (!existingConge.length) {
            return res.send({
                status: false,
                message: "Le congé n'existe pas"
            });
        }

        // 2. Vérifier si l'employé existe (si l'im_emp est modifié)
        if (updateData.im_emp && updateData.im_emp !== existingConge[0].im_emp) {
            const employe = await D.exec_params('SELECT * FROM employe WHERE emp_im = ?', [updateData.im_emp]);
            if (!employe.length) {
                return res.send({
                    status: false,
                    message: "L'employé n'existe pas"
                });
            }
        }

        // 3. Préparer les données à mettre à jour en utilisant les valeurs existantes si non fournies
        const finalUpdateData = {
            im_emp: updateData.im_emp || existingConge[0].im_emp,
            type_conge: updateData.type_conge || existingConge[0].type_conge,
            motif_conge: updateData.motif_conge || existingConge[0].motif_conge,
            nbr_jour: updateData.nbr_jour || existingConge[0].nbr_jour,
            etat_conge: updateData.etat_conge !== undefined ? updateData.etat_conge : existingConge[0].etat_conge
        };

        // 4. Vérifier le total des jours de congés si le nombre de jours ou l'employé change
        if (updateData.nbr_jour || updateData.im_emp) {
            const currentYear = new Date().getFullYear();
            const totalConges = await D.exec_params(`
                SELECT COALESCE(SUM(nbr_jour), 0) as total
                FROM conge 
                WHERE im_emp = ? 
                AND id_conge != ?
                AND YEAR(conge_date_enreg) = ?
                AND etat_conge = 1
            `, [finalUpdateData.im_emp, id_conge, currentYear]);

            const newTotal = totalConges[0].total + parseInt(finalUpdateData.nbr_jour);
            if (newTotal > 30) {
                return res.send({
                    status: false,
                    message: "Le nombre total de jours de congés ne peut pas dépasser 30 jours par an"
                });
            }
        }

        // 5. Mettre à jour le congé avec les nouvelles valeurs
        const result = await D.exec_params(`
            UPDATE conge 
            SET 
                im_emp = ?,
                type_conge = ?,
                motif_conge = ?,
                nbr_jour = ?,
                etat_conge = ?,
                date_modification = NOW()
            WHERE id_conge = ?
        `, [
            finalUpdateData.im_emp,
            finalUpdateData.type_conge,
            finalUpdateData.motif_conge,
            finalUpdateData.nbr_jour,
            finalUpdateData.etat_conge,
            id_conge
        ]);

        // 6. Vérifier si la mise à jour a été effectuée
        if (result.affectedRows === 0) {
            return res.send({
                status: false,
                message: "Aucune modification n'a été effectuée"
            });
        }

        return res.send({
            status: true,
            message: "Congé mis à jour avec succès",
            data: finalUpdateData
        });
    } catch (e) {
        console.error(e);
        return res.send({
            status: false,
            message: "Erreur lors de la mise à jour du congé"
        });
    }
}

static async delete(req, res) {
    try {
        const { id_conge } = req.params;

        // Vérifier si le congé existe
        const existingConge = await D.exec_params('SELECT * FROM conge WHERE id_conge = ?', [id_conge]);
        if (!existingConge.length) {
            return res.send({
                status: false,
                message: "Le congé n'existe pas"
            });
        }

        // Supprimer le congé
        await D.exec_params('DELETE FROM conge WHERE id_conge = ?', [id_conge]);

        return res.send({
            status: true,
            message: "Congé supprimé avec succès"
        });
    } catch (e) {
        console.error(e);
        return res.send({
            status: false,
            message: "Erreur lors de la suppression du congé"
        });
    }
}

static async find_all_conge(req, res) {
    try {
        const conges = await D.exec_params(`
            SELECT c.*, e.emp_nom_prenom 
            FROM conge c
            LEFT JOIN employe e ON e.emp_im = c.im_emp
            WHERE c.etat_conge = 1
            ORDER BY c.conge_date_enreg DESC
        `);

        return res.send({
            status: true,
            reponse: conges
        });
    } catch (e) {
        console.error(e);
        return res.send({
            status: false,
            message: "Erreur lors de la récupération des congés"
        });
    }
}

static async getTotalConges(req, res) {
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

        // Calculer le total des jours de congés pour l'année en cours
        const result = await D.exec_params(`
            SELECT COALESCE(SUM(nbr_jour), 0) as total
            FROM conge 
            WHERE im_emp = ? 
            AND YEAR(conge_date_enreg) = ?
            AND etat_conge = 1
        `, [im_emp, currentYear]);
        
        return res.send({ 
            status: true, 
            total: result[0].total 
        });
    } catch (e) {
        console.error(e);
        return res.send({ 
            status: false, 
            message: "Erreur lors du calcul du total des congés" 
        });
    }
}
}

module.exports = Conge;