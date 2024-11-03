// blogposts.js

// Ensure filesystem.js is loaded before this script

// Define blog posts
const blogPosts = [
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