import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Designer } from '../src/types/fashion';

interface TempData {
    designers: Designer[];
}

async function auditTempData() {
    // Read the temporary data
    const dataPath = join(process.cwd(), 'src/data/fashionGenealogy.tmp.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8')) as TempData;
    
    const designerIssues: Record<string, string[]> = {};
    
    // Audit designers
    data.designers.forEach((designer: Designer) => {
        const issues: string[] = [];
        
        // Required fields check
        if (!designer.name) issues.push('Missing name');
        if (designer.isActive === undefined) issues.push('Missing isActive status');
        if (!designer.status) issues.push('Missing status');
        
        // Data quality checks
        if (!designer.nationality) issues.push('Missing nationality');
        if (!designer.currentRole) issues.push('Missing currentRole');
        if (!designer.birthYear) issues.push('Missing birthYear');
        if (!designer.education || designer.education.length === 0) issues.push('Missing education history');
        if (!designer.signatureStyles || designer.signatureStyles.length === 0) issues.push('Missing signature styles');
        
        // Confidence score check
        if (!designer.confidence || designer.confidence < 0.7) issues.push('Low confidence score');
        if (!designer.sources || designer.sources.length === 0) issues.push('Missing sources');
        
        if (issues.length > 0) {
            designerIssues[designer.name] = issues;
        }
    });
    
    // Write audit results
    const auditPath = join(process.cwd(), 'data-audit/temp-designers-audit.json');
    writeFileSync(
        auditPath,
        JSON.stringify(
            {
                totalDesigners: data.designers.length,
                designersWithIssues: Object.keys(designerIssues).length,
                issues: designerIssues
            },
            null,
            2
        )
    );
}

auditTempData().catch(console.error);
