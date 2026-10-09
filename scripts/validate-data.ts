import { dataset } from '../src/data';
import { validateDataset } from '../src/lib/schema';

const errors = validateDataset(dataset, !process.argv.includes('--seed'));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`数据校验通过：${dataset.companies.length} 家公司，${dataset.relationships.length} 条关系，${dataset.events.length} 个事件，${dataset.articles.length} 篇报道。`);
}
