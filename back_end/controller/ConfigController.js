let D = require('../models/data')

class Config {
    // Récupérer les informations d'un utilisateur
    static async getUser(req, res) {
        try {
            const userId = req.params.id;
            
            let user = await D.exec_params(
                `SELECT util_id, util_name, util_email, util_pass FROM utilisateur WHERE util_id = ?`,
                [userId]
            )

            if (user.length > 0) {
                return res.send({
                    status: true,
                    data: user[0],
                    message: 'Utilisateur trouvé'
                })
            } else {
                return res.send({
                    status: false,
                    message: "Utilisateur non trouvé"
                })
            }
        } catch (e) {
            console.error(e)
            return res.send({
                status: false,
                message: "Erreur dans la base de données"
            })
        }
    }

    // Mettre à jour les informations d'un utilisateur
    static async updateUser(req, res) {
        try {
            const userId = req.params.id;
            const userData = req.body;

            // Vérification des champs requis
            if (!userData.util_name || !userData.util_email) {
                return res.send({
                    status: false,
                    message: "Le nom et l'email sont requis"
                })
            }

            // Construction de la requête de mise à jour
            let updateQuery = `UPDATE utilisateur SET 
                util_name = ?,
                util_email = ?`;
            
            let params = [
                userData.util_name,
                userData.util_email
            ];

            // Ajout du mot de passe à la mise à jour uniquement s'il est fourni
            if (userData.util_pass && userData.util_pass.trim() !== '') {
                updateQuery += `, util_pass = ?`;
                params.push(userData.util_pass);
            }

            // Ajout de la condition WHERE
            updateQuery += ` WHERE util_id = ?`;
            params.push(userId);

            // Exécution de la mise à jour
            await D.exec_params(updateQuery, params);

            // Récupération des données mises à jour
            let updatedUser = await D.exec_params(
                `SELECT util_id, util_name, util_email FROM utilisateur WHERE util_id = ?`,
                [userId]
            )

            if (updatedUser.length > 0) {
                return res.send({
                    status: true,
                    data: updatedUser[0],
                    message: 'Utilisateur mis à jour avec succès'
                })
            } else {
                return res.send({
                    status: false,
                    message: "Erreur lors de la mise à jour"
                })
            }

        } catch (e) {
            console.error(e)
            return res.send({
                status: false,
                message: "Erreur dans la base de données"
            })
        }
    }
}

module.exports = Config;