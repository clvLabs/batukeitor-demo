#!/bin/bash
REPO_LOCAL_PATH=${HOME}/src/javascript/batukeitor-demo

ZIP_URL_PREFIX=http://github.com/clvlabs/
ZIP_URL_SUFFIX=/archive/master.zip

# ----------------------------------------------------

function download () {
  PROJECT="$1"
  ZIP_URL="${ZIP_URL_PREFIX}${PROJECT}${ZIP_URL_SUFFIX}"
  curl -sLo "${PROJECT}.zip" "${ZIP_URL}"
  unzip -q "${PROJECT}.zip"
  rm "${PROJECT}.zip"
  mv "${PROJECT}-master" "${PROJECT}"
}

# ----------------------------------------------------
echo "Creating temp folder"

OLDPWD=$(pwd)
TEMPFOLDER=$(mktemp -d)
cd "${TEMPFOLDER}"

# ----------------------------------------------------
echo "Downloading/extracting repo ZIPs"

download batukeitor
download batukeitor-instruments
download batukeitor-crew-demo

# ----------------------------------------------------
echo "Building basic site structure"

mv batukeitor-instruments batukeitor/data/instruments
mv batukeitor-crew-demo batukeitor/data/crews/demo

# ----------------------------------------------------
echo "Making crews index"

CREW_INDEX=batukeitor/data/crews/index.yml
touch "${CREW_INDEX}"
echo "# Batukeitor crews" >> "${CREW_INDEX}"
echo ""                   >> "${CREW_INDEX}"
echo "crews:"             >> "${CREW_INDEX}"
echo "  - demo"           >> "${CREW_INDEX}"
echo ""                   >> "${CREW_INDEX}"
echo "defaultCrew: demo"  >> "${CREW_INDEX}"

# ----------------------------------------------------
echo "Removing unneeded files"

# All *.md files
find -type f -name "*md" -exec rm {} \;

# All *.sample.yml
find -type f -name "*sample.yml" -exec rm {} \;

# All .gitignore
find -type f -name ".gitignore" -exec rm {} \;

# Main repo resources folder
rm -rf batukeitor/resources

# Move current project's files so they will "get back" :)
mv ${REPO_LOCAL_PATH}/.gitignore batukeitor
mv ${REPO_LOCAL_PATH}/README.md batukeitor
mv ${REPO_LOCAL_PATH}/LICENSE.md batukeitor

# ----------------------------------------------------
echo "Updating demo project"

echo "- Deleting old files"
rm ${REPO_LOCAL_PATH}/* > /dev/null
rm ${REPO_LOCAL_PATH}/.* > /dev/null
rm -rf ${REPO_LOCAL_PATH}/app > /dev/null
rm -rf ${REPO_LOCAL_PATH}/data > /dev/null
rm -rf ${REPO_LOCAL_PATH}/dev > /dev/null

echo "- Copying new files"
cp -r batukeitor/* ${REPO_LOCAL_PATH}
cp -r batukeitor/.* ${REPO_LOCAL_PATH}

# ----------------------------------------------------
echo "Checking git status"
cd ${REPO_LOCAL_PATH}
git status

# ----------------------------------------------------
echo "Cleaning temp files"

cd "${OLDPWD}"
rm -rf "${TEMPFOLDER}"
