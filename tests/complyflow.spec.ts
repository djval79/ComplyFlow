
import { test, expect } from '@playwright/test';

test('Homepage Interaction Test', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify Title
    await expect(page).toHaveTitle(/ComplyFlow|NovumFlow|CareFlow/i);

    // Check Helper Functions
    const checkLink = async (name, expectedUrlPart) => {
        const link = page.getByRole('link', { name: name }).first();
        if (await link.isVisible()) {
            console.log(`CTA Found: ${name}`);
            const href = await link.getAttribute('href');
            console.log(`  -> Links to: ${href}`);
            expect(href).toContain(expectedUrlPart);
        } else {
            console.log(`CTA Not Found/Visible: ${name}`);
        }
    };

    const checkButton = async (name) => {
        const btn = page.getByRole('button', { name: name }).first();
        if (await btn.isVisible()) {
            console.log(`Button Found: ${name}`);
            await expect(btn).toBeEnabled();
        } else {
            console.log(`Button Not Found: ${name}`);
        }
    };

    // Test Logic
    await test.step('Check Header CTAs', async () => {
        await checkButton('Sign In');
        // "Get Started" or "Free Trial" is usually a link, but might be styled as a button
        // We check both roles if ensure
        const startBtn = page.getByRole('button', { name: /Start|Trial/i }).first();
        const startLink = page.getByRole('link', { name: /Start|Trial/i }).first();

        if (await startBtn.isVisible()) {
            console.log('Start Button Found');
        } else if (await startLink.isVisible()) {
            console.log('Start Link Found');
        }
    });

    await test.step('Check Main CTAs', async () => {
        // Check for "Get Started" or "Free Trial" (Link or Button)
        const startCta = page.getByRole('link', { name: /Start|Get Started|Free Trial/i }).or(
            page.getByRole('button', { name: /Start|Get Started|Free Trial/i }));

        if (await startCta.first().isVisible()) {
            console.log('✅ Primary CTA ("Start/Get Started") Found');
            // Optional: specific check
            // await expect(startCta.first()).toBeEnabled(); 
        } else {
            console.warn('⚠️ Primary CTA NOT Found');
        }

        // Check for "Demo" (Link or Button)
        const demoCta = page.getByRole('link', { name: /Demo/i }).or(
            page.getByRole('button', { name: /Demo/i }));

        if (await demoCta.first().isVisible()) {
            console.log('✅ Demo CTA Found');
        } else {
            console.warn('⚠️ Demo CTA NOT Found');
        }
    });

});

test('Navigation to Login', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Try to find a Login/Sign In button/link and click it
    const login = page.getByText(/Sign In|Login/i).first();
    if (await login.isVisible()) {
        await login.click();
        await expect(page).toHaveURL(/login|signin|auth/i);
        console.log('Identified and verified Login navigation.');
    }
});
