if [ -z "$1" ]
  then
    echo "No db dump specified. Usage ./restore-db.sh db-to-restore.sql"
    exit
fi

docker-compose down
docker-compose up -d db

echo "Drop current db"
docker-compose exec db dropdb -U postgres postgres
echo "Create new empty db"
docker-compose exec db createdb -U postgres postgres
echo "Restore db from $1"
docker-compose exec -T db psql -U postgres < "$1"

npm run dev
