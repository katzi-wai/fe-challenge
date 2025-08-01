import { useEffect, useState } from 'react'

const DatabaseTest = (): React.ReactElement => {
  const [testPlayer, setTestPlayer] = useState<any | null>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [testName, setTestName] = useState('TestPlayer')

  // Load players on component mount
  useEffect(() => {
    loadPlayers()
  }, [])

  // Load all players from the database
  const loadPlayers = async (): Promise<void> => {
    try {
      const leaderboard = await window.api.getLeaderboard()
      setPlayers(leaderboard)
      setMessage('Database connected successfully!')
    } catch (error) {
      console.error('Database error:', error)
      setMessage('Error connecting to database: ' + (error as Error).message)
    }
  }

  // Add a test player
  const handleAddPlayer = async (): Promise<void> => {
    try {
      const player = await window.api.getOrCreatePlayer(testName)
      setTestPlayer(player)

      // Start a game to record some data
      const game = await window.api.startGame(player.player_id, 100)

      // Record a test spin
      await window.api.recordSpin(game.gameId, "🍒, 🍋, 🍊", 10, 15)

      // // End the game
      await window.api.endGame(game.gameId, 105)
      setMessage(
        `Test complete: Added player ${player.name} (ID: ${player.player_id}) and recorded test data`
      )

      // Refresh the player list
      loadPlayers()
    } catch (error) {
      console.error('Test error:', error)
      setMessage('Error during test: ' + (error as Error).message)
    }
  }

  return (
    <div className="database-test" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>SQLite Database Connection Test</h1>

      <div
        style={{
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: message.includes('Error') ? '#f02849' : '#4caf50',
          borderRadius: '4px'
        }}
      >
        <p>
          <strong>Status:</strong> {message}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button
          onClick={handleAddPlayer}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1877f2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add Test Player & Data
        </button>
      </div>

      {!!testPlayer && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}
        >
          <h3>Last Added Player:</h3>
          <p>ID: {testPlayer.player_id}</p>
          <p>Name: {testPlayer.name}</p>
          <p>Created: {testPlayer.created_at}</p>
        </div>
      )}

      <div>
        <h2>Players in Database</h2>
        {players.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>
                  Name
                </th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>
                  Highest Balance
                </th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>
                  Total Spins
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={index}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{player.name}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                    {player.highest_balance}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                    {player.total_spins}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No players in database yet.</p>
        )}
      </div>
    </div>
  )
}

export default DatabaseTest
