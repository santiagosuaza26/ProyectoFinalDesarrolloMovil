describe('App launch', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
  });

  it('shows root container', async () => {
    await expect(element(by.id('app-root'))).toBeVisible();
  });
});
