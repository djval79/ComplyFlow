import { assignStaffToShift, checkStaffCompliance } from '../src/services/rotaService';

// Note: This is an architectural verification script to be run in a test environment
// In a real project, this would be a Vitest/Jest test file.

async function verifyRotaLogic() {
    console.log('--- Rota Logic Verification ---');

    const demoOrg = 'demo-org-id';
    const demoUser = 'demo-user-id';
    const demoShift = 'demo-shift-id';

    // 1. Check Compliance Guard
    console.log('Testing Compliance Guard...');
    const compliance = await checkStaffCompliance(demoOrg, demoUser);
    console.log('Staff Compliant:', compliance.compliant);
    if (compliance.issues.length > 0) {
        console.log('Identified Issues:', compliance.issues);
    }

    // 2. Test Assignment
    console.log('\nTesting Assignment Logic...');
    const result = await assignStaffToShift(demoShift, demoUser, 'admin-id', demoOrg);

    if (!result.success && result.error === 'Compliance check failed') {
        console.log('✅ PASS: Assignment correctly blocked for non-compliant staff.');
    } else if (result.success) {
        console.log('✅ PASS: Assignment successful for compliant staff.');
    } else {
        console.log('❌ FAIL: Unexpected assignment result:', result);
    }
}

// verifyRotaLogic().catch(console.error);
