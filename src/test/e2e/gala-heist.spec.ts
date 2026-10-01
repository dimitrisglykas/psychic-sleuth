import { test, expect } from '@playwright/test';

test.describe('Gala Heist Cinematic Flow', () => {
  test('Complete investigation flow for Case 002', async ({ page }) => {
    // 1. Launch & Case Selection
    await page.goto('/');
    
    // Open Cases overlay
    await page.getByRole('button', { name: 'Cases' }).click();
    await expect(page.getByRole('dialog', { name: 'Cases' })).toBeVisible();
    
    // Select The Gala Heist (Case 002)
    await page.getByRole('button', { name: 'The Gala Heist' }).click();

    // 2. Briefing Flow
    // Case briefing overlay
    await expect(page.getByRole('dialog', { name: 'Case briefing' })).toBeVisible();
    await expect(page.getByText('Incoming call')).toBeVisible();
    await page.getByRole('button', { name: 'Accept the case' }).click();
    
    // How to play overlay
    await expect(page.getByRole('dialog', { name: 'How to play' })).toBeVisible();
    await expect(page.getByText('Three things to do')).toBeVisible();
    await page.getByRole('button', { name: 'Start the investigation' }).click();

    // 3. Crime Scene Hotspots & Visual Evidence
    await page.getByRole('button', { name: 'Inspect crime scene' }).click();
    await expect(page.getByRole('dialog', { name: 'Crime scene' })).toBeVisible();
    
    // Search specific hotspots for Case 002
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
      
      // Verify new evidence notification pop-up
      await expect(page.getByText('New evidence')).toBeVisible();
      // Short wait for the notification to be clear, though we don't need to wait for it to fade
      await page.waitForTimeout(500); 
    }
    
    // Close crime scene
    await page.getByRole('button', { name: 'Close' }).click();

    // 4. Suspects & Interrogation Overlays
    // Switch to Nina (The Security Tech)
    // The sidebar buttons have names like "Nina" and show stress bars
    await page.getByRole('button', { name: 'Nina', exact: false }).click();
    await expect(page.getByText('Questioning Nina Reyes')).toBeVisible();

    // Interrogation Tactics - Cold Read
    await page.getByRole('button', { name: 'More tactics' }).click();
    await page.getByRole('button', { name: 'Cold read' }).click();
    // AI response with Jane's observation
    await expect(page.getByText('COLD READ')).toBeVisible();

    // 5. Overlays: Tea, Intuition, Desk
    // Sip Tea (Coffee icon)
    await page.getByRole('button', { name: 'Sip tea' }).click();
    await expect(page.getByText('Tea break')).toBeVisible();

    // Jane's Intuition
    await page.getByRole('button', { name: 'Intuition', exact: false }).click();
    await expect(page.getByRole('dialog', { name: 'Jane\'s intuition' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // My Desk
    await page.getByRole('button', { name: 'My desk' }).click();
    await expect(page.getByRole('dialog', { name: 'Psychic\'s desk' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // 6. Accusation & Win Flow
    // The "Solve case" button becomes active/highlighted when progress is made
    await page.getByRole('button', { name: 'Solve case' }).click();
    await expect(page.getByRole('dialog', { name: 'Solve the case' })).toBeVisible();
    
    // Step 1: Culprit
    await page.getByRole('button', { name: 'Dr. Helena Marsh' }).click();
    
    // Step 2: Motive
    await page.getByRole('button', { name: 'Pay off dangerous debts' }).click();
    
    // Step 3: Two key clues
    // Using clues found during the crime scene search
    await page.getByRole('button', { name: 'Camera Loop' }).click();
    await page.getByRole('button', { name: 'Keycard Log' }).click();

    // Make Accusation
    await page.getByRole('button', { name: 'Make the accusation' }).click();
    
    // Verify Case Outcome
    await expect(page.getByRole('dialog', { name: 'Case outcome' })).toBeVisible();
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

    // Player 1 switches to Case 002
    await page1.getByRole('button', { name: 'Cases' }).click();
    await page1.getByRole('button', { name: 'The Gala Heist' }).click();
    await page1.getByRole('button', { name: 'Accept the case' }).click();

    // Player 2 should still be on Case 001 (default) or independent
    // Verify the case title in the header
    await expect(page1.getByRole('heading', { level: 1 })).toHaveText('The Gala Heist');
    await expect(page2.getByRole('heading', { level: 1 })).toHaveText('The Enigma at Blackwood Manor');

    await context1.close();
    await context2.close();
  });
});
