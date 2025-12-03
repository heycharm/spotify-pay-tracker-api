import pool from "./db.js";


/* -------------------------------------------------------
   GET ALL USERS
-------------------------------------------------------- */
export const getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------
   GET USER DUES (latest entry)
-------------------------------------------------------- */
export const getUserDues = async (req, res) => {
  try {
    const { user_id } = req.params;

    const q = `
      SELECT *
      FROM monthly_dues
      WHERE user_id = $1
      ORDER BY id DESC
      LIMIT 1
    `;

    const result = await pool.query(q, [user_id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------
   MARK DUES AS PAID
-------------------------------------------------------- */
export const markPaid = async (req, res) => {
  try {
    const { user_id, payment_id, payment_method } = req.body;

    const q = `
      UPDATE monthly_dues
      SET 
        status = 'PAID',
        payment_id = $1,
        payment_method = $2,
        paid_date = NOW()
      WHERE user_id = $3 
        AND status = 'UNPAID'
    `;

    const result = await pool.query(q, [
      payment_id,
      payment_method,
      user_id,
    ]);

    res.json({ ok: true, updated: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------
   RENEW MONTH FOR ALL USERS
-------------------------------------------------------- */
export const renewMonth = async (req, res) => {
  try {
    const { month_name } = req.body;
    const monthly_amount = 30;

    if (!month_name) {
      return res.status(400).json({ error: "month_name is required" });
    }

    // 1. fetch all users
    const usersRes = await pool.query("SELECT id, name FROM users");
    const users = usersRes.rows;

    for (const u of users) {
      // 2. Check if user has any UNPAID row
      const duesRes = await pool.query(
        `
        SELECT id, months, total_due
        FROM monthly_dues
        WHERE user_id = $1 
          AND status = 'UNPAID'
        LIMIT 1
        `,
        [u.id]
      );

      const due = duesRes.rows[0];

      if (due) {
        // 3. UPDATE existing unpaid row — CONCAT in PG → || operator
        await pool.query(
          `
          UPDATE monthly_dues
          SET 
            months = months || ', ' || $1,
            total_due = total_due + $2
          WHERE id = $3
          `,
          [month_name, monthly_amount, due.id]
        );
      } else {
        // 4. INSERT brand new unpaid row
        await pool.query(
          `
          INSERT INTO monthly_dues 
            (user_id, user_name, months, total_due, status)
          VALUES ($1, $2, $3, $4, 'UNPAID')
          `,
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
