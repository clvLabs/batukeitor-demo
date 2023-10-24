#!/bin/bash
REPO_LOCAL_PATH=${HOME}/src/javascript/batukeitor-demo

ZIP_URL_PREFIX=http://github.com/clvlabs/
ZIP_URL_SUFFIX=/archive/master.zip

# ----------------------------------------------------

function download () {
  PROJECT="$1"
  FOLDER="$2"
  ZIP_URL="${ZIP_URL_PREFIX}${PROJECT}${ZIP_URL_SUFFIX}"
  curl -sLo "${PROJECT}.zip" "${ZIP_URL}"
  unzip -q "${PROJECT}.zip"
  rm "${PROJECT}.zip"
  mv "${PROJECT}-master" "${FOLDER}"
}

# ----------------------------------------------------
echo "Creating temp folder"

OLDPWD=$(pwd)
TEMPFOLDER=$(mktemp -d)
cd "${TEMPFOLDER}"

# ----------------------------------------------------
echo "Downloading/extracting repo ZIPs"

download batukeitor             new-site
download batukeitor-instruments instruments
download batukeitor-crew-demo   crew-demo

# ----------------------------------------------------
echo "Building basic site structure"

mv instruments new-site/data/instruments/default
mv crew-demo   new-site/data/crews/demo

# ----------------------------------------------------
echo "Making crews index"

CREW_INDEX=new-site/data/crews/index.yml
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

# All .gitignore
find -type f -name ".gitignore" -exec rm {} \;

# Main repo resources folder
rm -rf new-site/resources

# (possible) own dev/ folder in Batukeitor
rm -rf new-site/dev

# Move current project's files so they will "get back" :)
cp ${REPO_LOCAL_PATH}/.editorconfig  new-site
cp ${REPO_LOCAL_PATH}/.gitignore     new-site
cp ${REPO_LOCAL_PATH}/README.md      new-site
cp ${REPO_LOCAL_PATH}/LICENSE.md     new-site

# ----------------------------------------------------
echo "Updating demo project"

echo "- Deleting old files"
rm -f "${REPO_LOCAL_PATH}/*"
rm -f "${REPO_LOCAL_PATH}/.*"
rm -rf "${REPO_LOCAL_PATH}/app"
rm -rf "${REPO_LOCAL_PATH}/data"

echo "- Copying new files"
cp -r new-site/*   ${REPO_LOCAL_PATH}
echo "- Copying new files II"
cp -r new-site/.*  ${REPO_LOCAL_PATH}

# ----------------------------------------------------
echo "Checking git status"
cd ${REPO_LOCAL_PATH}
git status

# ----------------------------------------------------
echo "Cleaning temp files"

cd "${OLDPWD}"
rm -rf "${TEMPFOLDER}"
