const db = require('../models/data');

class DashboardController {
    static async getTotalEmployees(req, res) {
        try {
            const query = 'SELECT COUNT(*) as total FROM employe';
            const [result] = await db.exec_params(query, []);
            res.json({ total: parseInt(result.total) });
        } catch (error) {
            console.error('Erreur lors du comptage des employés:', error);
            res.status(500).json({
                status: false,
                message: "Erreur lors du comptage des employés",
                error: error.message
            });
        }
    }

    static async getStats(req, res) {
        try {
            const { employee, year, month } = req.query;
            
            // Créer les dates de début et fin du mois
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            
            // Formatage des dates pour la requête SQL
            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = endDate.toISOString().split('T')[0];
            
            let whereClause = 'WHERE DATE(pres_date_enreg) BETWEEN ? AND ?';
            let params = [formattedStartDate, formattedEndDate];
            
            if (employee && employee !== 'all') {
                whereClause += ' AND im_emp = ?';
                params.push(employee);
            }

            // Requête SQL modifiée pour correspondre exactement à la structure de la table
            const query = `
                SELECT 
                    SUM(CASE 
                        WHEN status_pres = 'present(e)' THEN 1
                        WHEN status_pres = 'present(e)(retard)' THEN 1
                        ELSE 0 
                    END) as totalPresent,
                    SUM(CASE 
                        WHEN status_pres = 'absent(e)' THEN 1
                        ELSE 0 
                    END) as totalAbsent,
                    SUM(CASE 
                        WHEN status_pres = 'present(e)(retard)' THEN 1
                        ELSE 0 
                    END) as totalRetards
                FROM presence
                ${whereClause}
            `;

            console.log('Query:', query);
            console.log('Params:', params);
            console.log('Dates:', formattedStartDate, formattedEndDate);

            const [stats] = await db.exec_params(query, params);

            console.log('Raw stats:', stats);

            const response = {
                status: true,
                data: {
                    totalPresent: parseInt(stats.totalPresent || 0),
                    totalAbsent: parseInt(stats.totalAbsent || 0),
                    totalRetards: parseInt(stats.totalRetards || 0)
                }
            };

            console.log('Response:', response);
            res.json(response);

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            res.status(500).json({
                status: false,
                message: "Erreur lors de la récupération des statistiques",
                error: error.message
            });
        }
    }
}

module.exports = DashboardController;