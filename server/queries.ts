// CTEs that pick the card shown for each dex number: the one you chose if
// you have, otherwise its earliest printing. Prefix with `WITH`.
export const CHOSEN_CARDS = `
  earliest AS (
    SELECT p.dex_id, p.card_id,
           ROW_NUMBER() OVER (
             PARTITION BY p.dex_id ORDER BY s.release_date, p.card_id
           ) AS rank
    FROM printings p
    JOIN sets s ON s.id = p.set_id
  ),
  chosen AS (
    SELECT e.dex_id, COALESCE(c.card_id, e.card_id) AS card_id, c.status
    FROM earliest e
    LEFT JOIN collection c ON c.dex_id = e.dex_id
    WHERE e.rank = 1
  )
`
