// blogposts.js

// Ensure filesystem.js is loaded before this script

// Define blog posts
const blogPosts = [
    {
        name: 'Build albert launcher on Fedora 41.md',
        type: 'file',
        date: '2024-11-11 02:40',
        permissions: '-rw-r--r--.',
        owner: 'earentir',
        group: 'earentir',
        content: [
            '# Build albert launcher on Fedora 41',
            'git clone --recursive https://github.com/albertlauncher/albert.git',
            'cmake -B build -S albert -DCMAKE_INSTALL_PREFIX=/usr -DCMAKE_BUILD_TYPE=Release',
            'dnf install qt6-qtbase-devel qt6-qt5compat-devel qt6-qtsvg-devel qt6-linguist qt6-qttools-devel qt6-qttools libqalculate-devel libarchive-devel python3-devel qt6-qtscxml-devel',
            'cmake --build build',
            'cmake --install build',
            'sudo cmake --install build'
        ]
    },
    {
        name: 'So... I used an LLM to make my overlay vfs better and it silently destroyed everything in the code base.md',
        type: 'file',
        date: '2024-11-06 20:51',
        permissions: '-rw-r--r--.',
        owner: 'earentir',
        group: 'earentir',
        content: [
            '#So... I used an LLM to make my overlay vfs better and it silently destroyed everything in the code base',
            'A few nights ago, while working on this site, I decided to give the whole codebase to claude (3.5 sonnet new) to do a simple thing, add another const of the same json scheme on the users side (local store) and merge them before any call, but only create new files on the user side json config. Looking at what it produced originally, I noticed that it was close but buggy and decide to use more queries in claude to debug it. That was a huge mistake, at one point it gave me back quite a bit of code, looked at one of the functions and noticed it split code to another function, didnt pay attention cause it was not a bad move to refactor it, it was getting long. I didnt notice though that after it did this move to a few more of the functions I was debugging, it slowly started removing the refactored functions and simplifying the code by just removing all of my code, till only a bit of the functionality was preserved, I bet that was perfect for the poor LLM token storage :P. So today I reverted all the changes in that dreaded commit, I will re instate the overlay vfs function at some point when I actually have the time to write it ;)'

        ]
    },
    {
        name: 'Q-Flash Plus (gigabyte).md',
        type: 'file',
        date: '2024-11-06 18:49',
        permissions: '-rw-r--r--.',
        owner: 'earentir',
        group: 'earentir',
        content: [
            '#Q-Flash Plus (gigabyte).md',
            'Place the firmware you want into a FAT32 formated usb drive, name the bios gigabyte.bin, place it into the dedicated usb port marked with BIOS above, while the PC is off, use a long item like a SIM slot pin to click the Q-Flash Button, after the BIOS is installed you will be rebooted to the BIOS screen.'
        ]
    },
    {
        name: 'shell script, echo command, fix for tab, no cmd space and cmd space.md',
        type: 'file',
        date: '2024-11-04 00:43',
        permissions: '-rw-r--r--.',
        owner: 'earentir',
        group: 'earentir',
        content: [
            '# shell script, echo command, fix for tab, no cmd space and cmd space',
            'Added the echo command to the terminal, with it I added the some env commands. Biggest addition is the shell script function, that will work as it is more like a bat from the MS-DOS world than a bach script, it will only execute commands one per line.',
            'Also finally fixed the annoying removal of the prompt space when we started typing anything, as well as the extra space when no command was entered.',
        ]
    },
    {
        name: 'washington post sub cancelation.md',
        type: 'file',
        date: '2024-10-29 03:58',
        permissions: '-rw-r--r--.',
        owner: 'earentir',
        group: 'earentir',
        content: [
            '# Washington Post Subscription Cancelation',
            'I just canceled by subscription to the Washington Post. It has been a good source of news for me over the years, but it has run its course, bezos decided to impose restrictions on the papers editors. He decided to support the fascist orange pig instead and did not allow their editorial about supporting Harris.',
            'Choosing to support his wallet for the tax cuts he will receive over keeping the paper free to report the news and its opinions, is a disgrace. Thus, I choose to vote with my wallet and cancel my subscription.',
        ]
    },
    {
        name: 'native go cpuid package.md',
        type: 'file',
        date: '2024-10-29 02:32',
        permissions: '-rw-r--r--.',
        owner: 'earentir',
        group: 'earentir',
        content: [
            '# Native GO cpuid Package',
            '',
            'I recently published a new Go package called `cpuid` that provides native CPUID feature identification for the x86 arch. This package is useful for detecting CPU features at runtime without relying on external tools or libraries.',
            'Its still in the early stages, but I plan to add more features and improvements over time. In order to achieve this, I had to write some assembly code to access the CPUID instruction directly from Go. It supports Linux & Windows systems and I may add support for more OSs in the future.',
            'After completing the x86 version, I plan to add support for RISC V and latter ARM systems as well.',
            '',
            'Visit the GH repo [cpuid](https://github.com/earentir/cpuid) for more details.',
            ''
        ]
    },
    {
        name: 'fun with js.md',
        type: 'file',
        date: '2024-10-27 02:24',
        permissions: '-rw-r--r--.',
        owner: 'earentir',
        group: 'earentir',
        content: [
            '# Introducing Earentir\'s Terminal',
            '',
            'Welcome to my site, emulating a terminal interface! This project was created using HTML, CSS, and JavaScript to provide a unique and interactive experience for visitors. In this second release I am introducing the blog feature!',
            '',
            'Its pretty basic right now, but I plan to add more features and improvements over time. Stay tuned for updates!',
            '',
            'Visit my [GitHub](https://github.com/earentir) for more projects.'
        ]
    },
    {
        name: 'hello world.md',
        type: 'file',
        date: '2024-10-27 02:18',
        permissions: '-rw-r--r--.',
        owner: 'earentir',
        group: 'earentir',
        content: [
            '# Hello World',
            '',
            'Testing md Support in the Terminal Blog',
            '',
            'Check out the [API Documentation](https://api.earentir.dev/doc/) for more details.'
        ]
    }
];

// Add blog posts to the blog directory with correct size calculations
(function addBlogPosts() {
    // Traverse to the 'home' directory
    const homeDir = fileSystem.children.find(child => child.name === 'home' && child.type === 'directory');
    if (!homeDir) {
        console.error('Home directory not found in the filesystem.');
        return;
    }

    // Traverse to the user directory (e.g., 'earentir')
    const userDir = homeDir.children.find(child => child.name === username && child.type === 'directory');
    if (!userDir) {
        console.error(`User directory '${username}' not found in the filesystem.`);
        return;
    }

    // Traverse to the 'blog' directory
    const blogDir = userDir.children.find(child => child.name === 'blog' && child.type === 'directory');

    if (blogDir) {
        const postsWithCorrectSize = blogPosts.map(post => ({
            ...post,
            size: calculateFileSize(post.content) // Dynamically calculate size
        }));
        blogDir.children.push(...postsWithCorrectSize);
        console.log('Blog posts added:', postsWithCorrectSize); // For debugging purposes
    } else {
        console.error('Blog directory not found in the filesystem.');
    }
})();
