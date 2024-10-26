#!/bin/bash

# txt2jsarr.sh
# Description: Converts a text file into a JavaScript object format for the terminal emulator app.

# Function to display usage instructions
usage() {
  echo "Usage: $0 <input_text_file> <output_js_file>"
  echo "Example: $0 example.txt example.js"
  exit 1
}

# Check if the correct number of arguments is provided
if [ "$#" -ne 2 ]; then
  usage
fi

input_file="$1"
output_file="$2"

# Check if the input file exists and is a regular file
if [ ! -f "$input_file" ]; then
  echo "Error: Input file '$input_file' not found or is not a regular file."
  exit 1
fi

# Extract file metadata using stat
# Check for GNU stat or BSD stat (macOS)
if stat --version >/dev/null 2>&1; then
  # GNU stat
  file_name=$(basename "$input_file")
  file_type="file"
  file_date=$(stat -c "%y" "$input_file" | cut -d'.' -f1)
  file_permissions=$(stat -c "%A" "$input_file")
  file_owner=$(stat -c "%U" "$input_file")
  file_group=$(stat -c "%G" "$input_file")
  file_size=$(stat -c "%s" "$input_file")
else
  # BSD stat (macOS)
  file_name=$(basename "$input_file")
  file_type="file"
  file_date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$input_file")
  file_permissions=$(stat -f "%Sp" "$input_file")
  file_owner=$(stat -f "%Su" "$input_file")
  file_group=$(stat -f "%Sg" "$input_file")
  file_size=$(stat -f "%z" "$input_file")
fi

# Start writing the JavaScript object to the output file
echo "{" > "$output_file"
echo "  name: '$file_name'," >> "$output_file"
echo "  type: '$file_type'," >> "$output_file"
echo "  date: '$file_date'," >> "$output_file"
echo "  permissions: '$file_permissions'," >> "$output_file"
echo "  owner: '$file_owner'," >> "$output_file"
echo "  group: '$file_group'," >> "$output_file"
echo "  size: $file_size," >> "$output_file"
echo "  content: [" >> "$output_file"

# Read the input file line by line
while IFS= read -r line || [ -n "$line" ]; do
  # Escape backslashes and single quotes using Bash parameter expansion
  escaped_line="${line//\\/\\\\}"   # Replace \ with \\
  escaped_line="${escaped_line//\'/\\\'}"  # Replace ' with \'
  
  # Append the escaped line to the output file
  echo "    '$escaped_line'," >> "$output_file"
done < "$input_file"

# Remove the trailing comma from the last line for valid JavaScript
# Handle GNU sed and BSD sed differences
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS (BSD sed)
  sed -i '' '$ s/,$//' "$output_file"
else
  # GNU sed (Linux)
  sed -i '$ s/,$//' "$output_file"
fi

# Close the JavaScript object
echo "  ]" >> "$output_file"
echo "}" >> "$output_file"

echo "Conversion complete! Check the output file: $output_file"
