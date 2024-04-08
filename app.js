const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

let db = null

const dbpath = path.join(__dirname, 'cricketMatchDetails.db')

const initilizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.massege}`)
  }
}

initilizeDbAndServer()

const convertingDbOject = dbobject => {
  return {
    playerId: dbobject.player_id,
    playerName: dbobject.player_name,
  }
}

const convertingDbOject_match = dbobject => {
  return {
    matchId: dbobject.match_id,
    match: dbobject.match,
    year: dbobject.year,
  }
}

app.get('/players/', async (request, response) => {
  const getplayerDetails = `
    SELECT
        *
    FROM
        player_details
    ORDER BY
        player_id;
    
    
    `
  const dbresopnse = await db.all(getplayerDetails)
  response.send(dbresopnse.map(eachobject => convertingDbOject(eachobject)))
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getplayer = `
  SELECT
    *
  FROM
    player_details
  WHERE
    player_id=${playerId}
  
  `
  const player = await db.get(getplayer)
  response.send(convertingDbOject(player))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updateplayer = `
  UPDATE
    player_details
  SET
    player_name="${playerName}"
  WHERE
    player_id=${playerId}
  
  
  `
  await db.run(updateplayer)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getmatch = `
  SELECT
    *
  FROM
    match_details
  WHERE
    match_id=${matchId}
  
  `

  const match = await db.get(getmatch)
  response.send(convertingDbOject_match(match))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchDetails = `
  SELECT 
    *
  FROM
    player_match_score NATURAL JOIN match_details
  WHERE 
    player_id=${playerId}
  

  
  `
  const matchDetails = await db.all(getMatchDetails)
  response.send(matchDetails.map(each => convertingDbOject_match(each)))
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getplayerId = `
  SELECT
    player_details.player_id as playerId,
    player_details.player_name as playerName
  FROM player_match_score NATURAL JOIN player_details
  WHERE
    match_id=${matchId}
  `
  const playerDetails = await db.all(getplayerId)
  response.send(playerDetails)
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getplayerstats = `
  SELECT
    player_details.player_id as playerId,
    player_details.player_name as playerName,
    SUM(player_match_score.score) as totalScore,
    SUM(player_match_score.fours) as totalFours,
    SUM(player_match_score.sixes) as totalSixes
  FROM player_match_score INNER JOIN player_details ON 
  player_details.player_id = player_match_score.player_id
  WHERE
    player_details.player_id=${playerId}
  
  `
  const playerstats = await db.get(getplayerstats)
  response.send(playerstats)
})

module.exports = app
