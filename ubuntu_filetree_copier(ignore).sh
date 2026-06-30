#!/bin/bash
# Ensure xclip is installed for the clipboard to work
if ! command -v xclip &> /dev/null; then
    echo "xclip is required. Installing..."
    sudo apt update && sudo apt install -y xclip
fi

# Get the root folder name
root_dir=$(basename "$PWD")

# Find files, format paths, and copy to clipboard
find . -type f | sed "s|^\.|${root_dir}|" | xclip -selection clipboard

echo "Project file paths copied to clipboard!"