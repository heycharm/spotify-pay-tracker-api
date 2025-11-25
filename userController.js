import db from './db.js'


// Get all users
export const getUsers = (req, res) => {
  db.query("SELECT id, name FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Get User Dues
export const getUserDues = (req, res) => {
  const { user_id } = req.params;

  const q =
    "SELECT * FROM monthly_dues WHERE user_id = ? ORDER BY id DESC LIMIT 1";

  db.query(q, [user_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows[0] || null);
  });
};

//  Mark dues as PAID
export const markPaid = (req, res) => {
  const { user_id, payment_id, payment_method } = req.body;

  const q = `
    UPDATE monthly_dues
    SET status='PAID',
        payment_id=?,
        payment_method=?,
        paid_date=CURDATE()
    WHERE user_id=? AND status='UNPAID'
  `;

  db.query(q, [payment_id, payment_method, user_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, updated: result.affectedRows });
  });
};

// Renew month 
export const renewMonth = async (req, res) => {
  try {
    const { month_name } = req.body;
    const monthly_amount = 30;

    if (!month_name) {
      return res.status(400).json({ error: "month_name is required" });
    }

    const dbPromise = db.promise(); 

    const [users] = await dbPromise.query("SELECT id, name FROM users");

    for (const u of users) {
      const [rows] = await dbPromise.query(
        `SELECT id, months, total_due 
         FROM monthly_dues 
         WHERE user_id = ? AND status = 'UNPAID'
         LIMIT 1`,
        [u.id]
      );

      if (rows.length > 0) {
        // UPDATE existing UNPAID row
        await dbPromise.query(
          `UPDATE monthly_dues
           SET months = CONCAT_WS(', ', months, ?),
               total_due = total_due + ?
           WHERE id = ?`,
          [month_name, monthly_amount, rows[0].id]
        );
      } else {
        // INSERT new row
        await dbPromise.query(
          `INSERT INTO monthly_dues 
           (user_id, user_name, months, total_due, status)
           VALUES (?, ?, ?, ?, 'UNPAID')`,
          [u.id, u.name, month_name, monthly_amount]
        );
      }
    }

    res.json({ ok: true, message: `Renewal processed for ${month_name}` });
  } catch (err) {
    console.error("Renew Error:", err);
    res.status(500).json({ error: err.message });
  }
};

