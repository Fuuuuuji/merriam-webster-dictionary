#!/bin/bash

# jq is required to parse the json file

# Check for the existence of the info.json file
if [ ! -f "src/info.json" ]; then
    echo "info.json file does not exist"
    exit 1
fi

# Extracting the version value from the info.json file
version=$(jq -r '.version' src/info.json)

if [ -z "$version" ]; then
    echo "No version value found"
    exit 1
fi

# Go to the src directory
cd src

# Generate plugin file
zip ../merriam-webster-dictionary-$version.bobplugin *.js *.json *.png

# Generate timestamp
timestamp=$(($(date +%s)*1000))

# Return to the previous directory
cd ..

# Calculate sha256 values
sha256=$(shasum -a 256 merriam-webster-dictionary-$version.bobplugin | awk '{print $1}')

# Update the item in appcast.json that matches the extracted version number, and add a new item if it does not exist
jq --arg version "$version" --arg sha256 "$sha256" --argjson timestamp $timestamp '
    if (.versions | map(.version) | index($version)) then
        .versions |= map(if .version == $version then .sha256 = $sha256 | .timestamp = $timestamp else . end)
    else
        .versions = [{"version": $version, "desc": "Update log","sha256": $sha256, "url": "https://github.com/Fuuuuuji/merriam-webster-dictionary/releases/download/\($version)/merriam-webster-dictionary-\($version).bobplugin", "minBobVersion": "0.5.0","timestamp": $timestamp}] + .versions
    end
' appcast.json > tmp.json && mv tmp.json appcast.json

echo "Packaged successfully"
