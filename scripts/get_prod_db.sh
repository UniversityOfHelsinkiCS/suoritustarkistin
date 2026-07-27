#!/bin/bash

FOLDER_NAME="suotar"

PROJECT_ROOT=$(dirname $(dirname $(realpath "$0")))
BACKUPS=$PROJECT_ROOT/backups/

S3_CONF=~/.s3cfg

if [ ! -f "$S3_CONF" ]; then
  echo ""
  echo "!! No config file for s3 bucket !!"
  echo "Create file for path ~/.s3cfg and copy the credetials from version.helsinki.fi"
  echo ""
  exit 1
fi

echo "Creating backups folder"
mkdir -p ${BACKUPS}

echo "Listing available backups in S3 bucket..."
backup_files=$(s3cmd -c "$S3_CONF" ls "s3://psyduck/${FOLDER_NAME}/" | awk '{print $4}' | grep '\.sql\.gz$')

if [ -z "$backup_files" ]; then
  echo "No backup files found in S3 bucket!"
  exit 1
fi

echo "Available backups:"
select chosen_backup in $backup_files; do
  if [ -n "$chosen_backup" ]; then
    echo "You selected: $chosen_backup"
    FILE_NAME=$(basename "$chosen_backup")
    break
  else
    echo "Invalid selection. Please select a valid backup number."
  fi
done

echo "Fetching the selected dump: $FILE_NAME"
s3cmd -c "$S3_CONF" get --force "$chosen_backup" "$BACKUPS"

if [ ! -f "${BACKUPS}${FILE_NAME}" ]; then
  echo "Download failed or file not found: ${BACKUPS}${FILE_NAME}"
  exit 1
fi

SQL_FILE_NAME="${FILE_NAME%.gz}"

echo "Unpacking ${FILE_NAME}"
gunzip -f ${BACKUPS}${FILE_NAME}

$PROJECT_ROOT/scripts/restore-db.sh ${BACKUPS}${SQL_FILE_NAME}

echo "Removing the local production dump"
rm ${BACKUPS}${SQL_FILE_NAME}
