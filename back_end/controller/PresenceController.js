const db = require('../models/data');

class PresenceController {
    static async register(req, res) {
        try {
            const { emp_im } = req.body;
            
            // Vérifier si l'employé existe
            const employe = await db.exec_params(
                'SELECT * FROM employe WHERE emp_im = ?',
                [emp_im]
            );
    
            if (!employe || employe.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: "Employé non trouvé"
                });
            }
    
            // Obtenir l'heure actuelle
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const currentTime = hours + minutes / 60;
    
            // Vérifier si c'est le matin ou l'après-midi
            const isMorning = hours < 12;
            
            // Vérifier s'il y a déjà un pointage pour aujourd'hui
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const existing = await db.exec_params(
                'SELECT * FROM presence WHERE im_emp = ? AND DATE(pres_date_enreg) = DATE(?)',
                [emp_im, now]
            );
    
            // Vérifier si l'employé a déjà pointé pour cette période
            if (existing && existing.length > 0) {
                const existingTime = new Date(existing[0].pres_date_enreg).getHours();
                const existingIsMorning = existingTime < 12;
    
                // Si on essaie de pointer dans la même période (matin ou après-midi)
                if (isMorning === existingIsMorning) {
                    return res.status(400).json({
                        status: false,
                        message: `Vous avez déjà pointé pour ${isMorning ? 'la matinée' : "l'après-midi"}`
                    });
                }
            }
    
            // Déterminer le statut selon l'heure
            let status_pres;
            if (isMorning) { // Période du matin
                if (currentTime <= 8) {
                    status_pres = 'present(e)';
                } else if (currentTime <= 10) {
                    status_pres = 'retard';
                } else {
                    status_pres = 'absent(e)';
                }
            } else { // Période de l'après-midi
                if (currentTime <= 14) {
                    status_pres = 'present(e)';
                } else if (currentTime <= 16) {
                    status_pres = 'retard';
                } else {
                    status_pres = 'absent(e)';
                }
            }
    
            // Insérer le nouveau pointage
            const result = await db.exec_params(
                'INSERT INTO presence (im_emp, status_pres, pres_date_enreg) VALUES (?, ?, ?)',
                [emp_im, status_pres, now]
            );
    
            const presence = {
                id_pres: result.insertId,
                im_emp: emp_im,
                status_pres,
                pres_date_enreg: now
            };
    
            return res.json({
                status: true,
                message: "Présence enregistrée",
                data: presence
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                status: false,
                message: "Erreur lors de l'enregistrement de la présence"
            });
        }
    }

    static async getDernier(req, res) {
        try {
            const { emp_im } = req.params;

            const presence = await db.exec_params(
                'SELECT * FROM presence WHERE im_emp = ? ORDER BY pres_date_enreg DESC LIMIT 1',
                [emp_im]
            );

            if (!presence || presence.length === 0) {
                return res.json({
                    status: false,
                    data:null
                });
            }

            return res.json({
                status: true,
                data: presence[0]
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                status: false,
                message: "Erreur lors de la récupération du dernier pointage"
            });
        }
    }

    
        static async delete(req, res) {
            try {
                await db.del('presence', req.params)
                    //Ici tous les fonctions sur l'enregistrement d'un presence
                return res.send({ status: true, message: "user supprimé." })
            } catch (e) {
                console.error(e)
                return res.send({ status: false, message: "Erreur dans la base de donnée" })
            }
    
        }
    
        //Récupération des détails des presences
        static async getDetailsUser(req, res) {
            try {
    
                let { id } = req.params
    
                //Récupération d'un simple presence
                let user = (await db.exec_params('select * from presence where id_pres = ?', id))[0]
    
                //Récupération accès modules
                let user_access = await db.exec_params(`select * from module
                left join util_access on module_id = ua_module_id 
                left join presence on id_pres = ?`, id)
    
    
    
                //à venir : récupération des historiques de l'presence
                let module_list = await db.exec('select * from module')
    
    
                // console.log(user);
    
                return res.send({ status: true, user, user_access, module_list })
    
            } catch (e) {
                console.error(e)
                return res.send({ status: false, message: "Erreur dans la base de donnée" })
            }
        }
    
        //Récupération des détails des presences
        static async setLogout(req, res) {
            try {
    
                let { id } = req.params
    
                //Récupération d'un simple presence
                let user = (await db.exec_params('select * from presence where id_pres = ?', id))[0]
    
                //Récupération accès modules
                let user_access = await db.exec_params(`select * from module
                left join util_access on module_id = ua_module_id 
                left join presence on id_pres = ?`, id)
    
    
    
                //à venir : récupération des historiques de l'presence
                let module_list = await db.exec('select * from module')
    
    
                // console.log(user);
    
                return res.send({ status: true, user, user_access, module_list })
    
            } catch (e) {
                console.error(e)
                return res.send({ status: false, message: "Erreur dans la base de donnée" })
            }
        }
    
        static async setAccess(req, res) {
    
            try {
                let email = req.body.util_email
                let pass = req.body.util_pass
    
                let _f = await db.exec_params(`select * from presence where util_email = ? and util_pass = ?`, [email, pass])
    
                if (_f.length > 0) {
                    await db.exec_params(`update presence set util_status='0' where util_email = ? and util_pass = ?`, [email, pass])
                }
                return res.send({ status: true, message: 'Deconnection fait' })
            } catch (e) {
                console.error(e)
                return res.send({ status: false, message: "Erreur dans la base de donnée" })
            }
        }
    
    
        static async setLogin(req, res) {
    
            try {
                let email = req.body.util_email
                let pass = req.body.util_pass
    
                let _f = await db.exec_params(`select * from presence where util_email = ? and util_pass = ?`, [email, pass])
    
                if (_f.length > 0) {
                    await db.exec_params(`update presence set util_status='1' where util_email = ? and util_pass = ?`, [email, pass])
                    return res.send({ status: true, message: 'connection fait' })
                } else {
                    return res.send({ status: false, message: "L'presence n'existe pas" })
                }
            } catch (e) {
                console.error(e)
                return res.send({ status: false, message: "Erreur dans la base de donnée" })
            }
        }
    
    
        static async getList(req, res) {
    
            // let find_val =req.body.find
            let filters = req.query
            let _obj_pat = {
                id_pres: 'id_pres',
                util_label: 'emp_nom_prenom',
            }
            let default_sort_by = 'id_pres'
    
            filters.page = (!filters.page) ? 1 : parseInt(filters.page)
            filters.limit = (!filters.limit) ? 100 : parseInt(filters.limit)
            filters.sort_by = (!filters.sort_by) ? _obj_pat[default_sort_by] : _obj_pat[filters.sort_by]
    
            try {
                let reponse = await db.exec_params(`select presence.*, employe.* 
                 from  
                 presence left join employe on employe.emp_im=presence.im_emp where presence.pres_date_enreg=? order by ${filters.sort_by} limit ? offset ? `, [
                    new Date().toDateString(),
                    filters.limit,
                    (filters.page - 1) * filters.limit
                ])
    
                //Liste total des presence
                let nb_total_presence = (await db.exec('select count(*) as nb from presence'))[0].nb
    
                return res.send({ status: true, reponse, nb_total_presence })
            } catch (e) {
                console.error(e)
                return res.send({ status: false, message: "Erreur dans la base de donnée" })
            }
        }
    
    
        static async getDays(req, res) {
            try {
                //A reserver recherche par nom_prenom
                let reponse = await db.exec_params(`select pres_date_enreg from presence group by pres_date_enreg order by pres_date_enreg desc`)
                    //Liste total des utilisateur
                let nb_total_utilisateur = (await db.exec('select count(*) as nb from utilisateur'))[0].nb
    
                return res.send({ status: true, reponse, nb_total_utilisateur })
            } catch (e) {
                console.error(e)
                return res.send({ status: false, message: "Erreur dans la base de donnée" })
            }
        }
    
        static async findList(req, res) {
            let filters = req.query;
            let _obj_pat = {
                id_pres: 'id_pres',
                util_label: 'emp_nom_prenom',
            };
            let default_sort_by = 'id_pres';
    
            filters.page = (!filters.page) ? 1 : parseInt(filters.page);
            filters.limit = (!filters.limit) ? 100 : parseInt(filters.limit);
            filters.sort_by = (!filters.sort_by) ? _obj_pat[default_sort_by] : _obj_pat[filters.sort_by];
    
            try {
                let query = `
                    SELECT presence.*, employe.* 
                    FROM presence 
                    LEFT JOIN employe ON employe.emp_im = presence.im_emp 
                    WHERE 1=1
                `;
                let params = [];
    
                // Add filters only if they are provided
                if (req.body.date) {
                    query += ` AND presence.pres_date_enreg = ?`;
                    params.push(new Date(req.body.date).toDateString());
                }
    
                if (req.body.immatricule) {
                    query += ` AND presence.im_emp LIKE ?`;
                    params.push(`%${req.body.immatricule}%`);
                }
    
                if (req.body.presence_id) {
                    query += ` AND presence.id_pres = ?`;
                    params.push(req.body.presence_id);
                }
    
                if (req.body.status) {
                    query += ` AND LOWER(presence.statut_pres) LIKE ?`;
                    params.push(`%${req.body.status.toLowerCase()}%`);
                }
    
                // Order by ID desc to show most recent first
                query += ` ORDER BY presence.id_pres DESC LIMIT ? OFFSET ?`;
                params.push(filters.limit, (filters.page - 1) * filters.limit);
    
                let reponse = await db.exec_params(query, params);
                let nb_total_presence = (await db.exec('SELECT COUNT(*) as nb FROM presence'))[0].nb;
    
                return res.send({ status: true, reponse, nb_total_presence });
            } catch (e) {
                console.error(e);
                return res.send({ status: false, message: "Erreur dans la base de donnée" });
            }
        }
    
}

module.exports = PresenceController;