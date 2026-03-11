import { promises as fs } from 'fs';
import path from 'path';

/**
 * Smartly determines the target subfolder for a community post
 * based on its filename and content.
 */
async function categorizeContent(filePath, content) {
    const filename = path.basename(filePath).toLowerCase();
    const lowerContent = content.toLowerCase();

    // 1. Case Studies: Often contain "performance", "optimization", "fix", "debug", "solved"
    if (filename.includes('case_study') || 
        filename.includes('optimization') || 
        lowerContent.includes('performance case study') ||
        lowerContent.includes('how we solved')) {
        return 'case-studies';
    }

    // 2. Interviews: Often contain "interview", "series", "problem", "follow-up"
    if (filename.includes('interview') || 
        lowerContent.includes('interview series') || 
        lowerContent.includes('interview problem')) {
        return 'interviews';
    }

    // 3. Guides: Often contain "how-to", "explainer", "guide", "setup"
    if (filename.includes('guide') || 
        filename.includes('explainer') || 
        filename.includes('how-to') ||
        lowerContent.includes('step-by-step guide') ||
        lowerContent.includes('how to set up')) {
        return 'guides';
    }

    // Default to articles
    return 'articles';
}

async function main() {
    const [action, ...args] = process.argv.slice(2);
    const root = process.cwd();
    const communityDir = path.join(root, 'community-content');

    if (action === 'organize') {
        const filePath = args[0];
        if (!filePath) {
            console.error('Please provide a file path to organize.');
            process.exit(1);
        }

        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
        const content = await fs.readFile(absolutePath, 'utf-8');
        const category = await categorizeContent(absolutePath, content);
        
        const targetDir = path.join(communityDir, category);
        await fs.mkdir(targetDir, { recursive: true });
        
        const targetPath = path.join(targetDir, path.basename(absolutePath));
        await fs.rename(absolutePath, targetPath);
        
        console.log(JSON.stringify({
            success: true,
            category,
            newPath: path.relative(root, targetPath)
        }));
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
