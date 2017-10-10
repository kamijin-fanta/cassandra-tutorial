# Cassandraサンプルプロジェクト

起動時にサンプルデータの自動投入が行われます。
Cassandraへのコネクションが起動時に行われなかったら、落ちてしまうので、適当に `docker start cassandra_web` とか叩くと良いかと思います。

```bash
$ node index.js (cassandra_hostname)
```


以下の環境で動作確認を行っています。

- Cassandra: 3.11.0
- Nodejs: v8.6.0
