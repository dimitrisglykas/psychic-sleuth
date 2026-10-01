import { test, expect } from '@playwright/test';

test.describe('Gala Heist Cinematic Flow', () => {
  test('Complete investigation flow for Case 002', async ({ page }) => {
    // 1. Launch & Case Selection
    await page.goto('/');
    await page.getByRole('button', { name: 'Cases' }).click();
    await page.getByRole('button', { name: 'The Gala Heist' }).click();

    // 2. Briefing Flow
    await expect(page.getByText('Incoming call')).toBeVisible();
    await page.getByRole('button', { name: 'Accept the case' }).click();
    await expect(page.getByText('Three things to do')).toBeVisible();
    await page.getByRole('button', { name: 'Start the investigation' }).click();

    // 3. Crime Scene Hotspots & Visual Evidence
    await page.getByRole('button', { name: 'Inspect crime scene' }).click();
    
    // Search all hotspots for Case 002
    const hotspots = [
      'Junction box',
      'Curator\'s office',
      'Display case',
      'Keycard reader',
      'Guard\'s radio'
    ];

    for (const spot of hotspots) {
      const button = page.getByRole('button', { name: `Search ${spot}` });
      await expect(button).toBeVisible();
      await button.click();
      // Verify new evidence pop-up appears and disappears or we can just proceed
      await expect(page.getByText('New evidence')).toBeVisible();
      // Wait for pop-up to fade or just click outside (it auto-dismisses in 2.6s)
      await page.waitForTimeout(1000); 
    }
    
    await page.getByRole('button', { name: 'Close' }).click();

    // 4. Suspects & Interrogation Overlays
    // Switch to Nina (The Tech)
    await page.getByRole('button', { name: 'Nina', exact: false }).click();
    await expect(page.getByText('Questioning Nina Reyes')).toBeVisible();

    // Cold Read
    await page.getByRole('button', { name: 'More tactics' }).click();
    await page.getByRole('button', { name: 'Cold read' }).click();
    await expect(page.getByText('COLD READ')).toBeVisible();

    // 5. Intuition & Tea Overlays
    // Sip Tea
    await page.getByRole('button', { name: 'Sip tea' }).click();
    await expect(page.getByText('Tea break')).toBeVisible();

    // Jane's Intuition
    await page.getByRole('button', { name: 'Intuition', exact: false }).click();
    await expect(page.getByText('Jane\'s intuition')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // 6. Accusation & Win Flow
    await page.getByRole('button', { name: 'Solve case' }).click();
    
    // Select Nina as Culprit
    await page.getByRole('button', { name: 'Nina Reyes' }).click();
    
    // Select Motive
    await page.getByRole('button', { name: 'Silence a guard taking bribes' }).click();
    
    // Select Clues (Camera Loop and Keycard Log)
    await page.getByRole('button', { name: 'Camera Loop' }).click();
    await page.getByRole('button', { name: 'Keycard Log' }).click();

    // Final Accusation
    await page.getByRole('button', { name: 'Make the accusation' }).click();
    
    // Verify Outcome
    await expect(page.getByText('Case outcome')).toBeVisible();
    await expect(page.getByText('Score')).toBeVisible();
  });

  test('Two-player isolation (Independent Contexts)', async ({ browser }) => {
    // Player 1 Context
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/');
    
    // Player 2 Context
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/');

    // Player 1 starts Case 002
    await page1.getByRole('button', { name: 'Cases' }).click();
    await page1.getByRole('button', { name: 'The Gala Heist' }).click();
    await page1.getByRole('button', { name: 'Accept the case' }).click();

    // Verify Player 2 is still on Case 001 (default) or at least not Case 002 briefing
    await expect(page2.getByText('The Enigma at Blackwood Manor')).toBeVisible();
    await expect(page1.getByText('The Gala Heist')).toBeVisible();

    // Cleanup
    await context1.close();
    await context2.close();
  });
});
