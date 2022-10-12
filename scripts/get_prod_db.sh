#!/bin/bash

CONTAINER=suotar_db
SERVICE_NAME=db
DB_NAME=postgres

SERVER=opetushallinto.cs.helsinki.fi
SERVER_FILE_NAME=suotar-$(date -d "yesterday" '+%Y%m%d')_001201.sql.gz
SERVER_FILE="/home/opetushallinto_user/suotar/backups/suotar/${SERVER_FILE_NAME}"
SQL_FILE=suotar-$(date -d "yesterday" '+%Y%m%d')_001201.sql

PROJECT_ROOT=$(dirname $(dirname $(realpath "$0")))
BACKUPS=$PROJECT_ROOT/backups/
DOCKER_COMPOSE=$PROJECT_ROOT/docker-compose.yml

USER_DATA_FILE_PATH=$PROJECT_ROOT/scripts/my_username

username=""

get_username() {
  # Check if username has already been set
  [ -z "$username" ]|| return 0

  # Check if username is saved to data file and ask it if not
  if [ ! -f "$USER_DATA_FILE_PATH" ]; then
    echo ""
    echo "!! No previous username data found. Will ask it now !!"
    echo "Enter your Uni Helsinki username:"
    read username
    echo $username > $USER_DATA_FILE_PATH
    echo "Succesfully saved username"
    echo ""
  fi

  # Set username
  username=$(cat $USER_DATA_FILE_PATH | head -n 1)
}

echo "Creating backups folder"
mkdir -p ${BACKUPS}

echo "Fetching a new dump"
get_username

scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi"  $username@$SERVER:$SERVER_FILE $BACKUPS

gunzip ${BACKUPS}${SERVER_FILE_NAME}

$PROJECT_ROOT/scripts/restore-db.sh ${BACKUPS}${SQL_FILE}
