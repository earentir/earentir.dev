// blogposts.js

// Ensure filesystem.js is loaded before this script

// Define blog posts
const blogPosts = [
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
