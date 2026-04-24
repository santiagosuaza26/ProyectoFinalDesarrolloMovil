describe('Auth flow', () => {
  beforeEach(async () => {
    await device.launchApp({newInstance: true});
  });

  it('navigates from login to register', async () => {
    await expect(element(by.id('login-email-input'))).toBeVisible();
    await element(by.id('go-to-register-button')).tap();
    await expect(element(by.id('register-full-name-input'))).toBeVisible();
  });

  it('stays on login screen with invalid credentials', async () => {
    await element(by.id('login-email-input')).replaceText('nonexistent-e2e@example.com');
    await element(by.id('login-password-input')).replaceText('123456');
    await element(by.id('login-submit-button')).tap();
    await expect(element(by.id('login-submit-button'))).toBeVisible();
  });
});
