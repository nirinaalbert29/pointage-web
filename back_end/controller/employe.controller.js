let utils = require("../utils/utils");
let D = require("../models/data");

class Employe {
    static async register(req, res) {
        let _d = req.body;
        let employe_data = {
            emp_im: { front_name: "emp_im", fac: true },
            emp_nom_prenom: { front_name: "emp_nom_prenom", fac: false },
            date_naiss: { front_name: "date_naiss", fac: false },
            sexe: { front_name: "sexe", fac: false },
            emp_fonction: { front_name: "emp_fonction", fac: false },
            emp_tel: { front_name: "emp_tel", fac: false },
            emp_adresse: { front_name: "emp_adresse", fac: false },
            emp_date_enreg: {
                front_name: "emp_date_enreg",
                fac: true,
                format: (a) => new Date(),
            },
        };

        //Vérification du employe
        const _pd_keys = Object.keys(employe_data);
        let _tmp = {};
        let _list_error = [];
        try {
            _pd_keys.forEach((v, i) => {
                _tmp = employe_data[v];
                if (!_tmp.fac && !_d[_tmp.front_name]) {
                    _list_error.push({ code: _tmp.front_name });
                }
            });

            if (_list_error.length > 0) {
                return res.send({
                    status: false,
                    message: "Certains champs sont vide ",
                    data: _list_error,
                });
            }

            let _data = {};
            _pd_keys.forEach((v, i) => {
                _tmp = employe_data[v];

                if (_tmp.format != undefined) {
                    _d[_tmp.front_name] = _tmp.format(_d[_tmp.front_name]);
                }

                _data[v] = _d[_tmp.front_name];
            });

            // let user = (await D.exec_params('select * from employe where emp_im = ?', employe_data.emp_im[emp_im]))
            // console.log(user);
            await D.set('employe', _data)
                //Ici tous les fonctions sur l'enregistrement d'un employe
            return res.send({ status: true, message: "user bien enregistrer." });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Immatricule déjà existant,veuillez changer puis réssayez!",
            });
        }
    }
    static async update(req, res) {
        let _d = req.body;
        
        // Structure des données employé
        let employe_data = {
            emp_im: { front_name: "emp_im", fac: false }, // Changé à false car c'est l'identifiant
            emp_nom_prenom: { front_name: "emp_nom_prenom", fac: false },
            date_naiss: { front_name: "date_naiss", fac: false },
            sexe: { front_name: "sexe", fac: false },
            emp_fonction: { front_name: "emp_fonction", fac: false },
            emp_tel: { front_name: "emp_tel", fac: false },
            emp_adresse: { front_name: "emp_adresse", fac: false },
            emp_date_enreg: {
                front_name: "emp_date_enreg",
                fac: true,
                format: (a) => new Date(),
            },
        };

        try {
            // Vérifier si l'employé existe avant la mise à jour
            const existingEmployee = await D.exec_params(
                'SELECT * FROM employe WHERE emp_im = ?',
                [_d.emp_im]
            );

            if (!existingEmployee || existingEmployee.length === 0) {
                return res.status(404).send({
                    status: false,
                    message: "Employé non trouvé"
                });
            }

            // Vérification des champs obligatoires
            const _pd_keys = Object.keys(employe_data);
            let _list_error = [];
            
            _pd_keys.forEach(key => {
                const field = employe_data[key];
                if (!field.fac && (!_d[field.front_name] || _d[field.front_name].trim() === '')) {
                    _list_error.push({ 
                        code: field.front_name,
                        message: `Le champ ${field.front_name} est obligatoire`
                    });
                }
            });

            if (_list_error.length > 0) {
                return res.status(400).send({
                    status: false,
                    message: "Certains champs obligatoires sont vides",
                    errors: _list_error,
                });
            }

            // Préparation des données à mettre à jour
            let _data = {};
            _pd_keys.forEach(key => {
                const field = employe_data[key];
                if (_d[field.front_name] !== undefined) {
                    if (field.format) {
                        _data[key] = field.format(_d[field.front_name]);
                    } else {
                        _data[key] = _d[field.front_name];
                    }
                }
            });

            // Conversion de la date de naissance
            if (_data.date_naiss) {
                _data.date_naiss = new Date(_data.date_naiss);
                
                // Vérification de la validité de la date
                if (isNaN(_data.date_naiss.getTime())) {
                    return res.status(400).send({
                        status: false,
                        message: "Format de date de naissance invalide"
                    });
                }
            }

            // Mise à jour dans la base de données
            await D.updateWhere("employe", _data, { emp_im: _data.emp_im });

            return res.send({ 
                status: true, 
                message: "Mise à jour effectuée avec succès",
                data: _data
            });

        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            return res.status(500).send({
                status: false,
                message: "Erreur lors de la mise à jour dans la base de données",
                error: error.message
            });
        }
    }

    static async delete(req, res) {
        try {
            await D.del("employe", req.params);
            //Ici tous les fonctions sur l'enregistrement d'un employe
            return res.send({ status: true, message: "user supprimé." });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Erreur dans la base de donnée",
            });
        }
    }

    //Récupération des détails des employes
    static async getDetailsUser(req, res) {
        try {
            let { id } = req.params;

            //Récupération d'un simple employe
            let user = (
                await D.exec_params("select * from employe where emp_im = ?", id)
            )[0];

            //Récupération accès modules
            let user_access = await D.exec_params(
                `select * from module
            left join util_access on module_id = ua_module_id 
            left join employe on emp_im = ?`,
                id
            );

            let module_list = await D.exec("select * from module");

            // console.log(user);

            return res.send({ status: true, user, user_access, module_list });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Erreur dans la base de donnée",
            });
        }
    }


    static async getList(req, res) {
        let filters = req.query;
        let _obj_pat = {
            emp_im: "emp_im",
            util_label: "emp_nom_prenom",
        };
        let default_sort_by = "emp_im";

        filters.page = !filters.page ? 1 : parseInt(filters.page);
        filters.limit = !filters.limit ? 100 : parseInt(filters.limit);
        filters.sort_by = !filters.sort_by ?
            _obj_pat[default_sort_by] :
            _obj_pat[filters.sort_by];

        try {
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(
                `select * from employe   order by ${filters.sort_by} limit ? offset ? `, [filters.limit, (filters.page - 1) * filters.limit]
            );

            //Liste total des employe
            let nb_total_employe = (
                await D.exec("select count(*) as nb from employe")
            )[0].nb;

            return res.send({ status: true, reponse, nb_total_employe });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Erreur dans la base de donnée",
            });
        }
    }

    static async getListDisp(req, res) {
        let filters = req.query;
        let _obj_pat = {
            emp_im: "emp_im",
            util_label: "emp_nom_prenom",
        };
        let default_sort_by = "emp_im";
        filters.page = !filters.page ? 1 : parseInt(filters.page);
        filters.limit = !filters.limit ? 100 : parseInt(filters.limit);
        filters.sort_by = !filters.sort_by ?
            _obj_pat[default_sort_by] :
            _obj_pat[filters.sort_by];
        try {
            //A reserver recherche par nom_prenom
            let reponse = await D.exec_params(
                `select employe.*,conge.etat_conge  from
             employe left join conge on employe.emp_im=conge.im_emp where 
             conge.etat_conge is null or conge.etat_conge=0  order by ${filters.sort_by} limit ? offset ? `, [filters.limit, (filters.page - 1) * filters.limit]
            );

            //Liste total des employe
            let nb_total_employe = (
                await D.exec("select count(*) as nb from employe")
            )[0].nb;

            return res.send({ status: true, reponse, nb_total_employe });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Erreur dans la base de donnée",
            });
        }
    }

    static async findList(req, res) {
        // let find_val =req.body.find
        let filters = req.query;
        let _obj_pat = {
            id_conge: "emp_im",
            emp_nom_prenom: "emp_nom_prenom",
        };
        let default_sort_by = "id_conge";
        filters.page = !filters.page ? 1 : parseInt(filters.page);
        filters.limit = !filters.limit ? 100 : parseInt(filters.limit);
        filters.sort_by = !filters.sort_by ?
            _obj_pat[default_sort_by] :
            _obj_pat[filters.sort_by];
        try {
            let reponse = await D.exec_params(
                `select employe.* 
             from  employe where 
             employe.emp_nom_prenom like ?  order by ${
               "employe." + filters.sort_by
             } limit ? offset ? `, [
                    "%" + req.body.find + "%",
                    filters.limit,
                    (filters.page - 1) * filters.limit,
                ]
            );
            //Liste total des conge
            let nb_total_conge = (
                await D.exec("select count(*) as nb from employe")
            )[0].nb;

            return res.send({ status: true, reponse, nb_total_conge });
        } catch (e) {
            console.error(e);
            return res.send({
                status: false,
                message: "Erreur dans la base de donnée",
            });
        }
    }

    static async getUser(req, res) {
        try {
            const { emp_im } = req.params;
            
            const user = await D.exec_params(
                'SELECT * FROM employe WHERE emp_im = ?',
                [emp_im]
            );

            if (!user || user.length === 0) {
                return res.status(404).json({ 
                    status: false,
                    message: "Employé non trouvé"
                });
            }

            return res.json({
                status: true,
                user: user[0]
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                status: false,
                message: "Erreur lors de la récupération des informations de l'employé"
            });
        }
    }

    async getAll(req, res) {
        try {
            const employees = await db.exec_params(`
                SELECT 
                    emp_im,
                    emp_nom_prenom,
                    date_naiss,
                    sexe,
                    emp_fonction,
                    emp_tel,
                    emp_adresse,
                    emp_date_enreg
                FROM employe
                ORDER BY emp_nom_prenom ASC
            `);

            res.json({
                status: true,
                data: employees
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des employés:', error);
            res.status(500).json({
                status: false,
                message: "Erreur lors de la récupération des employés"
            });
        }
    }

    async getDetailedStats(req, res) {
        try {
            const { emp_im } = req.params;
            const { year, month } = req.query;

            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            const [presences, absences, conges] = await Promise.all([
                db.exec_params(`
                    SELECT 
                        COUNT(CASE WHEN status_pres = 'present' THEN 1 END) as total_present,
                        COUNT(CASE WHEN status_pres = 'retard' THEN 1 END) as total_retard
                    FROM presence 
                    WHERE im_emp = ? 
                    AND DATE(pres_date_enreg) BETWEEN DATE(?) AND DATE(?)
                `, [emp_im, startDate, endDate]),

                db.exec_params(`
                    SELECT COUNT(*) as total_absences, SUM(nb_jours) as total_jours_absence
                    FROM absence 
                    WHERE im_emp = ? 
                    AND DATE(date_debut) <= DATE(?) 
                    AND DATE(date_fin) >= DATE(?)
                `, [emp_im, endDate, startDate]),

                db.exec_params(`
                    SELECT COUNT(*) as total_conges, SUM(nbr_jour) as total_jours_conge
                    FROM conge 
                    WHERE im_emp = ? 
                    AND etat_conge = 'accepté'
                    AND DATE(conge_date_enreg) BETWEEN DATE(?) AND DATE(?)
                `, [emp_im, startDate, endDate])
            ]);

            res.json({
                status: true,
                data: {
                    presences: presences[0],
                    absences: absences[0],
                    conges: conges[0]
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques détaillées:', error);
            res.status(500).json({
                status: false,
                message: "Erreur lors de la récupération des statistiques détaillées"
            });
        }
    }
}

module.exports = Employe;