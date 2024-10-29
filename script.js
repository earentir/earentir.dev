// script.js

// Ensure filesystem.js is loaded before this script

// Initialize the current directory path from localStorage or home directory
let currentPath = JSON.parse(localStorage.getItem('terminal-currentPath')) || ['/', 'home', username];

// Variables to track Tab presses
let lastTabTime = 0;
let tabPressCount = 0;
const TAB_PRESS_INTERVAL = 500; // Time in milliseconds to detect double Tab

// Utility function to get the current directory object
function getCurrentDirectory() {
    let dir = fileSystem;
    for (let i = 1; i < currentPath.length; i++) {
        const folderName = currentPath[i];
        const found = dir.children.find(child => child.type === 'directory' && child.name === folderName);
        if (found) {
            dir = found;
        } else {
            break;
        }
    }
    return dir;
}

// Initialize username and hostname
const hostname = 'hera';
let username = localStorage.getItem('terminal-username') || 'earentir';
const homeDirPath = `/home/${username}/`;

// Define available commands
const commands = {
    ls: handleLs,
    cat: handleCat,
    help: handleHelp,
    clear: handleClear,
    cd: handleCd,
    su: handleSu,
    grep: handleGrep,
    pwd: handlePwd
};

// Initialize the terminal
window.onload = () => {
    const terminal = document.getElementById('terminal');
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const prompt = document.getElementById('prompt');

    // If currentPath is not set in localStorage, initialize it to home directory
    if (!localStorage.getItem('terminal-currentPath')) {
        currentPath = ['/', 'home', username];
        localStorage.setItem('terminal-currentPath', JSON.stringify(currentPath));
    }

    updatePrompt();

    input.focus();

    // Command history
    let commandHistory = [];
    let historyIndex = -1;
    const MAX_HISTORY = 100;

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const userInput = input.value.trim();
            if (userInput) {
                commandHistory.push(userInput);
                if (commandHistory.length > MAX_HISTORY) {
                    commandHistory.shift();
                }
                historyIndex = commandHistory.length;
            }
            processCommand(userInput, output);
            input.value = '';
            updateBlockCursor();
            scrollToBottom(terminal);
        } else if (event.key === 'ArrowUp') {
            if (historyIndex > 0) {
                historyIndex--;
                input.value = commandHistory[historyIndex];
                updateBlockCursor();
            }
            event.preventDefault();
        } else if (event.key === 'ArrowDown') {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[historyIndex];
                updateBlockCursor();
            } else {
                historyIndex = commandHistory.length;
                input.value = '';
                updateBlockCursor();
            }
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();

            const currentTime = new Date().getTime();

            if (currentTime - lastTabTime < TAB_PRESS_INTERVAL) {
                tabPressCount++;
            } else {
                tabPressCount = 1;
            }

            lastTabTime = currentTime;

            if (tabPressCount === 2) {
                // Double Tab pressed
                handleTabCompletion(input, 'double');
                tabPressCount = 0; // Reset the count
            } else {
                // Single Tab pressed
                handleTabCompletion(input, 'single');
            }
        } else {
            setTimeout(updateBlockCursor, 0);
        }
    });


    // **Add this event listener to focus input when clicking on the terminal**
    terminal.addEventListener('click', function (event) {
        // Check if the clicked element is not a link (<a>) to allow link interactions
        if (event.target !== input && event.target.tagName !== 'A') {
            input.focus();
        }
    });
};

function updateBlockCursor() {
    const input = document.getElementById('input');
    const blockCursor = document.getElementById('block-cursor');

    if (!input || !blockCursor) return; // Prevent errors if elements are missing

    const text = input.value.substring(0, input.selectionStart);
    const font = window.getComputedStyle(input).font;

    // Create a temporary span to calculate text width
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.whiteSpace = 'pre';
    tempSpan.style.font = font;
    tempSpan.textContent = text || ' '; // Prevent empty span
    document.body.appendChild(tempSpan);
    const textWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);

    // Update the block cursor position with a slight delay for smoother animation
    requestAnimationFrame(() => {
        blockCursor.style.left = `${textWidth}px`;
    });
}

// Process user commands
function processCommand(input, output) {
    if (!input) return;

    appendOutput(`${username}@${hostname}:${getFormattedPath()}$ ${input}`, output);

    const [command, ...args] = parseInput(input);

    if (commands[command]) {
        const result = commands[command](args);
        if (result !== undefined) {
            if (Array.isArray(result)) {
                result.forEach(line => appendOutput(line, output));
            } else {
                appendOutput(result, output);
            }
        }
    } else {
        appendOutput(`Command not found: ${command}`, output);
    }
}

function parseInput(input) {
    const args = [];
    let currentArg = '';
    let inQuotes = false;
    let quoteChar = '';
    let escaping = false;

    for (let i = 0; i < input.length; i++) {
        const c = input[i];

        if (escaping) {
            currentArg += c;
            escaping = false;
        } else if (c === '\\') {
            escaping = true;
        } else if (inQuotes) {
            if (c === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            } else {
                currentArg += c;
            }
        } else {
            if (c === '"' || c === "'") {
                inQuotes = true;
                quoteChar = c;
            } else if (/\s/.test(c)) {
                if (currentArg.length > 0) {
                    args.push(currentArg);
                    currentArg = '';
                }
            } else {
                currentArg += c;
            }
        }
    }

    if (currentArg.length > 0) {
        args.push(currentArg);
    }

    return args;
}

// Command Handlers

function handleLs(args) {
    const flags = parseFlags(args);
    const directoryArgs = args.filter(arg => !arg.startsWith('-'));

    // If directory arguments are provided, list each one
    if (directoryArgs.length > 0) {
        const output = [];

        directoryArgs.forEach((path, index) => {
            const resolvedDir = resolvePathWithoutChanging(path);

            if (!resolvedDir) {
                output.push(`ls: cannot access '${path}': No such file or directory`);
            } else {
                // If multiple directories, add a header
                if (directoryArgs.length > 1) {
                    output.push(`${path}:`);
                }

                let entries;
                if (resolvedDir.type === 'directory') {
                    entries = resolvedDir.children;
                } else {
                    // If it's a file, list the file itself
                    entries = [resolvedDir];
                }

                // Handle -a flag (show hidden files)
                if (!flags.a) {
                    entries = entries.filter(entry => !entry.name.startsWith('.'));
                }

                // Sort entries: directories first, then files
                entries.sort((a, b) => {
                    if (a.type === b.type) return a.name.localeCompare(b.name);
                    return a.type === 'directory' ? -1 : 1;
                });

                // Additional sorting for blog directory
                const currentListingPath = getFormattedPath();
                if (resolvedDir.name === 'blog' || currentListingPath.endsWith('/blog')) {
                    entries.sort((a, b) => {
                        const dateA = new Date(a.date);
                        const dateB = new Date(b.date);
                        return dateB - dateA; // Newest first
                    });
                }

                if (flags.l || flags.s) {
                    const lines = [];
                    if (flags.l) {
                        let total = 0;
                        entries.forEach(entry => {
                            if (entry.type === 'file') {
                                total += calculateFileSize(entry.content);
                            } else if (entry.type === 'directory') {
                                total += 4096; // **Fixed size for directories**
                            }
                        });
                        lines.push(`total ${total}`);
                        entries.forEach(entry => {
                            const permissions = entry.permissions;
                            const linkCount = 1; // Simplified
                            const owner = entry.owner;
                            const group = entry.group;
                            // **Set size to 4096 for directories, calculate for files**
                            const size = entry.type === 'file' ? calculateFileSize(entry.content) : 4096;
                            const date = entry.date;
                            const name = entry.name + (entry.type === 'directory' ? '/' : '');
                            // **Format size to six spaces**
                            const formattedSize = size.toString().padStart(6, ' ');
                            lines.push(`${permissions} ${linkCount} ${owner} ${group} ${formattedSize} ${date} ${name}`);
                        });
                        output.push(...lines);
                    } else if (flags.s) {
                        let total = 0;
                        entries.forEach(entry => {
                            if (entry.type === 'file') {
                                total += calculateFileSize(entry.content);
                            } else if (entry.type === 'directory') {
                                total += 4096; // **Fixed size for directories**
                            }
                        });
                        lines.push(`total ${total}`);
                        entries.forEach(entry => {
                            // **Set size to 4096 for directories, calculate for files**
                            const size = entry.type === 'file' ? calculateFileSize(entry.content) : 4096;
                            // **Format size to six spaces**
                            const formattedSize = size.toString().padStart(6, ' ');
                            lines.push(`${formattedSize} ${entry.name}`);
                        });
                        output.push(...lines);
                    }
                } else {
                    // Simple ls
                    const line = entries.map(entry => entry.name + (entry.type === 'directory' ? '/' : '')).join('  ');
                    output.push(line);
                }
            }

            // Add a blank line between directories, except after the last one
            if (index < directoryArgs.length - 1) {
                output.push('');
            }
        });

        return output;
    } else {
        // No directory arguments, list current directory
        let entries = getCurrentDirectory().children;

        // Handle -a flag (show hidden files)
        if (!flags.a) {
            entries = entries.filter(entry => !entry.name.startsWith('.'));
        }

        // Sort entries: directories first, then files
        entries.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
        });

        // Additional sorting for blog directory
        if (getCurrentDirectory().name === 'blog' || getFormattedPath().endsWith('/blog')) {
            entries.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA; // Newest first
            });
        }

        if (flags.l || flags.s) {
            const lines = [];
            if (flags.l) {
                let total = 0;
                entries.forEach(entry => {
                    if (entry.type === 'file') {
                        total += calculateFileSize(entry.content);
                    } else if (entry.type === 'directory') {
                        total += 4096; // **Fixed size for directories**
                    }
                });
                lines.push(`total ${total}`);
                entries.forEach(entry => {
                    const permissions = entry.permissions;
                    const linkCount = 1; // Simplified
                    const owner = entry.owner;
                    const group = entry.group;
                    // **Set size to 4096 for directories, calculate for files**
                    const size = entry.type === 'file' ? calculateFileSize(entry.content) : 4096;
                    const date = entry.date;
                    const name = entry.name + (entry.type === 'directory' ? '/' : '');
                    // **Format size to six spaces**
                    const formattedSize = size.toString().padStart(6, ' ');
                    lines.push(`${permissions} ${linkCount} ${owner} ${group} ${formattedSize} ${date} ${name}`);
                });
                return lines;
            } else if (flags.s) {
                let total = 0;
                entries.forEach(entry => {
                    if (entry.type === 'file') {
                        total += calculateFileSize(entry.content);
                    } else if (entry.type === 'directory') {
                        total += 4096; // **Fixed size for directories**
                    }
                });
                lines.push(`total ${total}`);
                entries.forEach(entry => {
                    // **Set size to 4096 for directories, calculate for files**
                    const size = entry.type === 'file' ? calculateFileSize(entry.content) : 4096;
                    // **Format size to six spaces**
                    const formattedSize = size.toString().padStart(6, ' ');
                    lines.push(`${formattedSize} ${entry.name}`);
                });
                return lines;
            }
        } else {
            // Simple ls
            return entries.map(entry => entry.name + (entry.type === 'directory' ? '/' : '')).join('  ');
        }
    }
}



function handleCat(args) {
    if (args.length === 0) {
        return 'cat: missing operand';
    }

    let path = args[0].trim();

    // Handle special case for '~' to refer to root
    if (path === '~') {
        path = '/';
    }

    const fileEntry = resolvePathWithoutChanging(path);

    if (!fileEntry) {
        return `cat: ${args[0]}: No such file`;
    }

    if (fileEntry.type !== 'file') {
        return `cat: ${args[0]}: Is a directory`;
    }

    // Check if the file is a Markdown file
    const isMarkdown = fileEntry.name.endsWith('.md');

    if (isMarkdown) {
        // Convert Markdown to HTML using Marked.js
        const markdownContent = fileEntry.content.join('\n');
        const htmlContent = marked.parse(markdownContent);

        // Create a div to hold the rendered Markdown
        const renderedDiv = document.createElement('div');
        renderedDiv.classList.add('markdown-output');
        renderedDiv.innerHTML = htmlContent;

        // Apply syntax highlighting if Highlight.js is included
        if (window.hljs) {
            renderedDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }

        // Append the rendered Markdown to the output
        const output = document.getElementById('output');
        output.appendChild(renderedDiv);
    } else {
        // For non-Markdown files, display as plain text with link parsing
        const processedContent = fileEntry.content.map(line => parseLineForLinks(line)).join('\n');
        appendOutput(processedContent, document.getElementById('output'));
    }
}

function handleHelp() {
    return `Supported commands:
- ls [options] [directories]: List files
  Options:
    -l : Long listing format
    -a : All files (including hidden)
    -s : Show sizes
    -la, -al, -ls, -sl, -as, -sa : Combination of flags
- cat <file_path>: View file contents
  - Supports file paths, e.g., cat "folder name/file.txt" or cat folder\\ name/file.txt
- cd <directory>: Change directory
  - cd .. : Go up one directory
  - cd ~ : Go to home directory
- su - <username>: Switch user
- help: Show this help message
- clear: Clear the terminal`;
}

function handleClear() {
    const output = document.getElementById('output');
    output.innerHTML = '';
}


function handleCd(args) {
    if (args.length === 0) {
        path = homeDirPath;
    }

    let path = args[0].trim();

    // Handle special case for '~' to go to home directory
    if (path === '~') {
        path = homeDirPath;
    }

    const resolvedDir = resolvePath(path);

    if (!resolvedDir) {
        return `cd: ${path}: No such directory`;
    }

    if (resolvedDir.type !== 'directory') {
        return `cd: ${path}: Not a directory`;
    }

    // Update the current path based on the resolved path
    currentPath = buildCurrentPath(resolvedDir);
    localStorage.setItem('terminal-currentPath', JSON.stringify(currentPath));
    updatePrompt();
}


function handleSu(args) {
    if (args.length < 2 || args[0] !== '-') {
        return 'Usage: su - <username>';
    }

    const newUsername = args[1];
    if (!newUsername) {
        return 'su: missing username';
    }

    username = newUsername;
    localStorage.setItem('terminal-username', username);
    updatePrompt();
}

// Utility Functions

function appendOutput(text, output) {
    const line = document.createElement('div');
    line.innerHTML = text; // Supports clickable links and rendered Markdown
    output.appendChild(line);
    scrollToBottom(output); // Ensure the latest output is visible
}

function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

function parseFlags(args) {
    const flags = { l: false, a: false, s: false };
    args.forEach(arg => {
        if (arg.startsWith('-') && arg.length > 1) { // Ensure it's not just '-'
            arg.slice(1).split('').forEach(flag => {
                if (flags.hasOwnProperty(flag)) {
                    flags[flag] = true;
                }
            });
        }
    });
    return flags;
}

function calculateTotalSize(entries) {
    return entries.reduce((acc, entry) => acc + entry.size, 0);
}

function handlePwd(args) {
    if (currentPath.length === 1) {
        return '/';
    }

    return '/' + currentPath.slice(1).join('/') + '/';
}

function getFormattedPath() {
    // If we're at root
    if (currentPath.length === 1) {
        return '/';
    }

    // Get the exact user's home directory path
    const homePrefix = ['/', 'home', username];

    // Check if current path exactly matches or starts with user's home directory
    const isInUserHome = currentPath.length >= 3 &&
        currentPath[1] === 'home' &&
        currentPath[2] === username;

    if (isInUserHome) {
        if (currentPath.length === 3) {
            // Exactly at user's home directory
            return '~';
        } else {
            // In a subdirectory of user's home
            return '~/' + currentPath.slice(3).join('/');
        }
    }

    // Not in user's home directory, return full path
    return '/' + currentPath.slice(1).join('/');
}

function updatePrompt() {
    const prompt = document.getElementById('prompt');
    prompt.textContent = `${username}@${hostname}:${getFormattedPath()}$ `;
}

// Tab Completion Functionality
function handleTabCompletion(inputElement, tabType) {
    const input = inputElement.value;
    const cursorPos = inputElement.selectionStart;
    const beforeCursor = input.substring(0, cursorPos);
    const afterCursor = input.substring(cursorPos);

    // Split the input into tokens
    const tokens = beforeCursor.split(' ').filter(arg => arg);

    let suggestions = [];

    if (tokens.length === 0) {
        if (tabType === 'double') {
            // Show all available commands
            suggestions = Object.keys(commands);
        }
    } else {
        const command = tokens[0];
        const partial = tokens[tokens.length - 1];
        const isFirstToken = tokens.length === 1;

        if (isFirstToken) {
            // We're completing a command name
            suggestions = getCommandSuggestions(partial);
        } else {
            // We're completing arguments for a command
            switch (command) {
                case 'cd':
                    suggestions = getSuggestions(partial, 'directory');
                    break;
                case 'cat':
                    suggestions = getSuggestions(partial, 'file');
                    break;
                default:
                    suggestions = getSuggestions(partial, 'file_directory');
                    break;
            }
        }
    }

    // Handle double tab - just show suggestions
    if (tabType === 'double' && suggestions.length > 0) {
        const output = document.getElementById('output');
        const currentPrompt = `${username}@${hostname}:${getFormattedPath()}$ ${input}`;

        // Show current input, suggestions, and a new prompt
        appendOutput(currentPrompt, output);
        appendOutput(suggestions.join('  '), output);
        appendOutput('', output); // Empty line for spacing

        // Do NOT modify the input field's contents
        return;
    }

    // Handle single tab - attempt completion
    if (tabType === 'single' && suggestions.length > 0) {
        if (suggestions.length === 1) {
            // Single match - complete it
            const partial = tokens[tokens.length - 1];
            const partialStart = beforeCursor.length - partial.length;
            const completion = suggestions[0];

            const newInput = beforeCursor.slice(0, partialStart) +
                completion +
                (completion.endsWith('/') ? '' : ' ') +
                afterCursor;

            const newCursorPos = partialStart +
                completion.length +
                (completion.endsWith('/') ? 0 : 1);

            inputElement.value = newInput;
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
        } else {
            // Multiple matches - complete common prefix
            const commonPrefix = findCommonPrefix(suggestions);
            const partial = tokens[tokens.length - 1];

            if (commonPrefix.length > partial.length) {
                const partialStart = beforeCursor.length - partial.length;
                const newInput = beforeCursor.slice(0, partialStart) + commonPrefix + afterCursor;
                const newCursorPos = partialStart + commonPrefix.length;

                inputElement.value = newInput;
                inputElement.setSelectionRange(newCursorPos, newCursorPos);
            }
        }
    }

    updateBlockCursor();
}

function findCommonPrefix(strings) {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
        while (!strings[i].startsWith(prefix)) {
            prefix = prefix.substring(0, prefix.length - 1);
            if (prefix === '') return '';
        }
    }
    return prefix;
}

function getCommandSuggestions(partial) {
    return Object.keys(commands).filter(cmd => cmd.startsWith(partial));
}

function getSuggestions(partial, type) {
    const lastSlashIndex = partial.lastIndexOf('/');
    let dirPath = '';
    let namePart = partial;

    if (lastSlashIndex !== -1) {
        dirPath = partial.substring(0, lastSlashIndex + 1);
        namePart = partial.substring(lastSlashIndex + 1);
    }

    let dir = dirPath ? resolvePathWithoutChanging(dirPath) : getCurrentDirectory();

    if (!dir || dir.type !== 'directory') {
        return [];
    }

    return dir.children
        .filter(entry => {
            if (!entry.name.startsWith(namePart)) return false;

            switch (type) {
                case 'directory':
                    return entry.type === 'directory';
                case 'file':
                    return entry.type === 'file';
                case 'file_directory':
                    return true;
                default:
                    return false;
            }
        })
        .map(entry => {
            const fullName = dirPath + entry.name;
            return entry.type === 'directory' ? fullName + '/' : fullName;
        })
        .sort();
}

function escapeSpaces(name) {
    return name.replace(/ /g, '\\ ');
}

// Function to parse a line for URLs and convert them to clickable links
function parseLineForLinks(line) {
    // Regular expression to detect URLs (simple version)
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Replace URLs with clickable links
    return line.replace(urlRegex, '<a href="$1" class="link" target="_blank">$1</a>');
}

// Resolve Directory Path (used by cd)
function resolvePath(inputPath) {
    if (!inputPath) return getCurrentDirectory();

    // Handle absolute paths
    if (inputPath.startsWith('/')) {
        return traversePath(fileSystem, inputPath.split('/').filter(part => part));
    }

    // Handle home directory shortcut
    if (inputPath.startsWith('~')) {
        const relativePath = inputPath.slice(1).replace(/^\/+/, '');
        const fullPath = homeDirPath + relativePath;
        return traversePath(fileSystem, fullPath.split('/').filter(part => part));
    }

    // Handle relative paths
    return traversePath(getCurrentDirectory(), inputPath.split('/').filter(part => part));
}

// Helper function to traverse the filesystem based on path parts
function traversePath(currentDir, pathParts) {
    let dir = currentDir;
    for (let part of pathParts) {
        if (part === '..') {
            if (dir.parent) {
                dir = dir.parent;
            }
            continue;
        }
        const found = dir.children.find(child => child.name === part);
        if (!found) {
            return null;
        }
        dir = found;
    }
    return dir;
}

// Ensure each directory has a reference to its parent
function initializeFileSystem(fs, parent = null) {
    fs.parent = parent;
    if (fs.type === 'directory') {
        fs.children.forEach(child => initializeFileSystem(child, fs));
    }
}

initializeFileSystem(fileSystem);

// Resolve Directory/File Path without changing currentPath (used by ls and cat)
function resolvePathWithoutChanging(path) {
    if (!path) return getCurrentDirectory();

    const parts = path.split('/').filter(part => part.length > 0);
    let dir = path.startsWith('/') ? fileSystem : getCurrentDirectory();

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === '.') {
            continue;
        } else if (part === '..') {
            if (currentPath.length > 1) {
                // Clone currentPath to avoid modifying the original
                const tempPath = [...currentPath];
                tempPath.pop();
                const tempDir = getDirectoryByPath(tempPath);
                if (tempDir) {
                    dir = tempDir;
                } else {
                    return null;
                }
            } else {
                // Already at root
                dir = fileSystem;
            }
        } else {
            const foundDir = dir.children.find(child => child.type === 'directory' && child.name === part);
            if (foundDir) {
                dir = foundDir;
            } else {
                // Check if it's the last part and could be a file
                const isLast = i === parts.length - 1;
                if (isLast) {
                    const file = dir.children.find(child => child.name === part && child.type === 'file');
                    if (file) {
                        return file;
                    }
                }
                return null; // Directory or file not found
            }
        }
    }

    return dir;
}


// Helper function to get directory by path array
function getDirectoryByPath(pathArray) {
    let dir = fileSystem;
    for (let i = 1; i < pathArray.length; i++) { // Start from 1 to skip root '/'
        const part = pathArray[i];
        const found = dir.children.find(child => child.type === 'directory' && child.name === part);
        if (found) {
            dir = found;
        } else {
            return null;
        }
    }
    return dir;
}

// Build Current Path Array
function buildCurrentPath(dir) {
    const path = [];
    let current = dir;

    // Traverse up the directory tree to build the path
    while (current && current.name !== '/') {
        path.unshift(current.name);
        current = findParentDirectory(fileSystem, current);
    }

    path.unshift('/'); // Root directory
    return path;
}

// Find Parent Directory Function
function findParentDirectory(currentDir, targetDir) {
    for (const child of currentDir.children) {
        if (child.type === 'directory') {
            if (child === targetDir) {
                return currentDir;
            }
            const found = findParentDirectory(child, targetDir);
            if (found) return found;
        }
    }
    return null;
}

function calculateFileSize(contentArray) {
    // Calculate the total number of characters in the content array, including newlines
    return contentArray.reduce((total, line) => total + line.length + 1, 0); // +1 for each newline
}

function handleGrep(args) {
    if (args.length < 2) {
        return 'Usage: grep [-r] [-i] <pattern> <file|directory>';
    }

    let recursive = false;
    let caseInsensitive = false;
    let pattern;
    let targetPath;
    let startIndex = 0;

    // Check for flags
    while (args[startIndex].startsWith('-')) {
        const flags = args[startIndex].substring(1).split('');
        flags.forEach(flag => {
            if (flag === 'r') recursive = true;
            if (flag === 'i') caseInsensitive = true;
        });
        startIndex++;
        if (startIndex >= args.length) break;
    }

    if (args.length < startIndex + 2) {
        return 'Usage: grep [-r] [-i] <pattern> <file|directory>';
    }

    pattern = args[startIndex];
    targetPath = args.slice(startIndex + 1).join(' ');

    // Resolve the target path without changing the current path
    const targetEntry = resolvePathWithoutChanging(targetPath);

    if (!targetEntry) {
        return `grep: ${targetPath}: No such file or directory`;
    }

    if (targetEntry.type === 'file') {
        return searchInFile(targetEntry, pattern, caseInsensitive);
    } else if (targetEntry.type === 'directory') {
        if (!recursive) {
            return `grep: ${targetPath}: Is a directory. Use -r to search directories recursively.`;
        }
        return searchInDirectory(targetEntry, pattern, targetPath, caseInsensitive);
    } else {
        return `grep: ${targetPath}: Unsupported file type`;
    }
}

// Update the helper functions to handle case-insensitive search
function searchInFile(file, pattern, caseInsensitive = false) {
    const matches = [];
    const regex = caseInsensitive ? new RegExp(pattern, 'i') : new RegExp(pattern);

    file.content.forEach((line, index) => {
        if (regex.test(line)) {
            matches.push(`${file.name}:${index + 1}:${line}`);
        }
    });

    if (matches.length === 0) {
        return '';
    }

    return matches.join('\n');
}

function searchInDirectory(directory, pattern, basePath, caseInsensitive = false) {
    const matches = [];
    const regex = caseInsensitive ? new RegExp(pattern, 'i') : new RegExp(pattern);

    directory.children.forEach(entry => {
        const entryPath = `${basePath}/${entry.name}`;
        if (entry.type === 'file') {
            entry.content.forEach((line, index) => {
                if (regex.test(line)) {
                    matches.push(`${entryPath}:${index + 1}:${line}`);
                }
            });
        } else if (entry.type === 'directory') {
            // Recursively search in subdirectories
            const subMatches = searchInDirectory(entry, pattern, entryPath, caseInsensitive);
            if (subMatches) {
                matches.push(subMatches);
            }
        }
    });

    return matches.join('\n');
}
