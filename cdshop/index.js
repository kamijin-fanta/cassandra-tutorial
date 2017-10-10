const cassandra = require('cassandra-driver');
const yaml = require('js-yaml');
const fs = require('fs');
const express = require('express');


const server = express();
server.set('view engine', 'ejs');
const client = new cassandra.Client({
  contactPoints: [process.argv[2]],
  socketOptions: {
    connectTimeout: 1000,
  }
});


async function createScheme() {
  console.log('createScheme...');

  // create keyspace
  await client.execute(`
    CREATE KEYSPACE IF NOT EXISTS cd_shop
    WITH replication = {
      'class': 'SimpleStrategy',
      'replication_factor': 3
    };
  `);

  // create table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS cd_shop.musics (
      jan text,             // JANコード
      release date STATIC,  // アルバムのリリース日
      album text STATIC,    // アルバム名
      track int,            // 曲のトラック番号
      music text,           // 曲名
      PRIMARY KEY (jan, track)
    );
  `);

  console.log('OK!');
}
async function loadInitialData () {
  console.log('loadInitialData...');

  await client.execute(`TRUNCATE cd_shop.musics`);

  let docs = fs.readFileSync('./data.yaml', 'utf8');
  let albums = yaml.safeLoad(docs);

  for (let album of albums) {
    for (let track in album.tracks) {
      let insert = `INSERT INTO cd_shop.musics(jan, album, release, track, music) VALUES(?, ?, ?, ?, ?);`;
      let params = [album.jan + '', album.title, album.release, +track + 1, album.tracks[track]];
      await client.execute(insert, params, { prepare: true });
    }
  }
}

async function startHttpServer () {
  server.get('/', async (req, res, next) => {
    var list = await client.execute(`SELECT * FROM cd_shop.musics PER PARTITION LIMIT 1`);
    res.render('pages/index', {
      albums: list.rows
    });
    next();
  });
  server.get('/album/:jan', async (req, res, next) => {
    let select = `SELECT * FROM cd_shop.musics WHERE jan = ?`;
    let params = [req.params.jan];
    let tracks = await client.execute(select, params, { prepare: true });

    res.render('pages/album', {
      album: tracks.rows[0] ? tracks.rows[0] : {},
      tracks: tracks.rows,
    });
    next();
  });

  var listen = await server.listen(3000);
  console.log('listen: http://localhost:3000');
}

async function main() {
  try {
    await createScheme();
    await startHttpServer();
    await loadInitialData();
  } catch (e) {
    console.error(e);
    await client.shutdown();
  } finally {
  }
}

main();
