import { app, ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { join } from 'path'

// Database instance
let db: Database.Database | null = null

/**
 * Initialize the database
 */
export function initDatabase(): Database.Database {
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'slotmachine.db')

  console.log(`Database path: ${dbPath}`)

  // Create the database
  db = new Database(dbPath)

  // Enable foreign keys and WAL mode for better performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Create tables
  createTables()

  return db
}

/**
 * Create tables if they don't exist
 */
function createTables(): void {
  if (!db) return

  // Players table
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      player_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      highest_balance INTEGER DEFAULT 0,
      total_spins INTEGER DEFAULT 0
    )
  `)

  // Games table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      game_id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP,
      starting_balance INTEGER NOT NULL,
      ending_balance INTEGER,
      FOREIGN KEY (player_id) REFERENCES players (player_id)
    )
  `)

  // Spins table
  db.exec(`
    CREATE TABLE IF NOT EXISTS spins (
      spin_id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      symbols TEXT NOT NULL,
      bet_amount INTEGER NOT NULL,
      win_amount INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games (game_id)
    )
  `)

  // Add a default player if none exists
  const playerCount = db.prepare('SELECT COUNT(*) as count FROM players').get() as { count: number }
  if (playerCount.count === 0) {
    db.prepare('INSERT INTO players (name) VALUES (?)').run('Player 1')
  }
}

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    initDatabase()
  }
  return db as Database.Database
}

/**
 * Set up IPC handlers for database operations
 */
export function setupIpcHandlers(): void {
  // Get or create player
  ipcMain.handle('get-or-create-player', (_, playerName: string) => {
    // Check if player exists
    let player = getDatabase()
      .prepare('SELECT * FROM players WHERE name = ?')
      .get(playerName) as any

    // If player doesn't exist, create a new one
    if (!player) {
      const result = getDatabase().prepare('INSERT INTO players (name) VALUES (?)').run(playerName)
      player = getDatabase()
        .prepare('SELECT * FROM players WHERE player_id = ?')
        .get(result.lastInsertRowid)
    }

    return player
  })

  // Start new game
  ipcMain.handle('start-game', (_, playerId: number, startingBalance: number) => {
    const result = getDatabase()
      .prepare('INSERT INTO games (player_id, starting_balance) VALUES (?, ?)')
      .run(playerId, startingBalance)

    return { gameId: result.lastInsertRowid }
  })

  // Record spin
  ipcMain.handle(
    'record-spin',
    (_, gameId: number, symbols: string, betAmount: number, winAmount: number) => {
      const result = getDatabase()
        .prepare(
          `
      INSERT INTO spins (game_id, symbols, bet_amount, win_amount)
      VALUES (?, ?, ?, ?)
    `
        )
        .run(gameId, symbols, betAmount, winAmount)

      // Update player stats
      getDatabase()
        .prepare(
          `
      UPDATE players SET 
        total_spins = total_spins + 1,
        highest_balance = CASE 
          WHEN (SELECT (starting_balance + (
            SELECT COALESCE(SUM(win_amount - bet_amount), 0) 
            FROM spins 
            WHERE game_id = ?
          )) FROM games WHERE game_id = ?) > highest_balance 
          THEN (SELECT (starting_balance + (
            SELECT COALESCE(SUM(win_amount - bet_amount), 0) 
            FROM spins 
            WHERE game_id = ?
          )) FROM games WHERE game_id = ?)
          ELSE highest_balance
        END
      WHERE player_id = (SELECT player_id FROM games WHERE game_id = ?)
    `
        )
        .run(gameId, gameId, gameId, gameId, gameId)

      return { spinId: result.lastInsertRowid }
    }
  )

  // End game
  ipcMain.handle('end-game', (_, gameId: number, endingBalance: number) => {
    return getDatabase()
      .prepare(
        `
      UPDATE games 
      SET end_time = CURRENT_TIMESTAMP, ending_balance = ? 
      WHERE game_id = ?
    `
      )
      .run(endingBalance, gameId)
  })

  // Get leaderboard
  ipcMain.handle('get-leaderboard', () => {
    return getDatabase()
      .prepare(
        `
      SELECT name, highest_balance, total_spins 
      FROM players 
      ORDER BY highest_balance DESC 
      LIMIT 10
    `
      )
      .all()
  })
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
