import { test, expect, type Page } from '@playwright/test';

async function choose(page: Page, query: string, name: string) {
  await page.getByRole('combobox', { name: '搜索公司、英文名或别名' }).fill(query);
  await page.getByRole('option').filter({ hasText: name }).click();
}
test('单选、双选、第三家公司替换、取消与重置', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page).toHaveTitle('AI 经纬 · 中国 AI 公司关系地图');
  await expect(page.getByRole('heading', { name: 'AI 经纬', exact: true })).toBeVisible();
  await choose(page, 'Huawei', '华为');
  await expect(page.getByRole('heading', { name: '华为', exact: true })).toBeVisible();
  await choose(page, '万兴', '万兴科技');
  await expect(page.getByRole('heading', { name: '华为 × 万兴科技', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: '共同报道' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: '资本关系', exact: true }).click();
  await expect(page.getByRole('heading', { name: '华为 × 万兴科技', exact: true })).toBeVisible();
  await expect(page.getByRole('button').filter({ hasText: '华为云与万兴科技签订' })).toBeVisible();
  await choose(page, '腾讯', '腾讯');
  await expect(page.getByRole('heading', { name: '华为 × 腾讯', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '取消选择华为' }).click();
  await expect(page.getByRole('heading', { name: '腾讯', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '重置', exact: true }).click();
  await expect(page.getByRole('button', { name: '产业关系', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('combobox', { name: '节点大小' })).toHaveValue('equal');
  await expect(page.getByRole('heading', { name: /从一家公司/ })).toBeVisible();
  expect(errors).toEqual([]);
});
test('有共同报道、没有关系与无共同报道分开处理', async ({ page }) => {
  await page.goto('/');
  await choose(page, '硅基', '硅基流动');
  await choose(page, 'Kimi', '月之暗面');
  await expect(page.getByText('当前资料未收录两家公司的已确认关系。', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '硅基流动上线 Kimi K2.7 Code', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '重置', exact: true }).click();
  await choose(page, 'Tencent', '腾讯');
  await choose(page, '万兴', '万兴科技');
  await expect(page.getByRole('heading', { name: '暂未收录共同报道' })).toBeVisible();
  await page.getByRole('button', { name: '查看各自动态', exact: true }).click();
  await expect(page.getByRole('tab', { name: '各自动态' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: '腾讯的动态' })).toBeVisible();
});
test('关系证据、历史比例与缺失市值', async ({ page }) => {
  await page.goto('/');
  await choose(page, '阿里', '阿里巴巴');
  await choose(page, 'Kimi', '月之暗面');
  await page.getByRole('button').filter({ hasText: '年报确认阿里巴巴在 2024 财年' }).click();
  await expect(page.getByRole('heading', { name: '支持来源' })).toBeVisible();
  await expect(page.getByText('约 36% · 2024-03-31', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '阿里巴巴 · 查看原文' })).toHaveAttribute('href', /static.alibabagroup.com/);
  await page.getByRole('button', { name: '返回共同报道', exact: true }).click();
  await expect(page.getByRole('tab', { name: '共同报道' })).toBeVisible();
  await page.getByRole('combobox', { name: '节点大小' }).selectOption('marketCap');
  await expect(page.getByText('面积按市值对数压缩，非严格比例 · 虚线圆：无可比市值')).toBeVisible();
  await page.getByRole('button', { name: '取消选择阿里巴巴' }).click();
  await expect(page.getByText('无可比市值。当前资料未收录同日、同口径的上市公司市值。')).toBeVisible();
});
test('地图缩放、资料说明与响应式无横向溢出', async ({ page }, testInfo) => {
  await page.goto('/');
  const before = await page.getByLabel('缩放比例').textContent();
  await page.getByRole('button', { name: '放大地图' }).click();
  await expect(page.getByLabel('缩放比例')).not.toHaveText(before!);
  await page.getByRole('button', { name: '显示全图' }).click();
  await page.getByRole('button', { name: '关于资料' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '返回地图' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await choose(page, '华为', '华为');
  await choose(page, '万兴', '万兴科技');
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: '收起详情' }).click();
    await expect(page.getByRole('button', { name: '展开详情' })).toBeVisible();
    await page.getByRole('button', { name: '展开详情' }).click();
    await expect(page.getByRole('heading', { name: '华为 × 万兴科技', exact: true })).toBeVisible();
  }
  await page.screenshot({ path: testInfo.outputPath('website.png'), fullPage: true });
});
