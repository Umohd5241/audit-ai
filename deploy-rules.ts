import { app } from './lib/firebase-admin';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

async function deployRules() {
    try {
        const source = fs.readFileSync('firestore.rules', 'utf8');
        console.log('Uploading rules...');
        
        const rules = admin.securityRules(app);
        
        await rules.releaseFirestoreRulesetFromSource(source);
        console.log('Successfully deployed Firestore rules!');
    } catch (e: any) {
        console.error('Error deploying rules:', e.message || e);
    }
}

deployRules();
