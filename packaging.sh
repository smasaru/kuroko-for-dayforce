#!/bin/bash

VERSION=$(cat ./app/manifest.json|grep '"version":' |grep -o "\d*\.\d*\.\d*\.\d*")
PACKAGE_FILE_NAME=Kuroko4Dayforce_${VERSION}.zip

echo "Start packing new app version ${VERSION} to ${PACKAGE_FILE_NAME}"

cd ./app/
zip -r -FS ../../${PACKAGE_FILE_NAME} *

echo "Done."
echo "Please upload the file ${PACKAGE_FILE_NAME} to Chrome Web Store: Developer Dashboard and Mozilla Add-on Developer Hub."
