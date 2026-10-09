import type { Layer, RelationType, View } from './schema';
export const layerLabels: Record<Layer, string> = {
  hardware: '芯片与硬件', cloud: '算力与云基础设施', model: '基础模型',
  platform: '开发工具与平台', application: '应用与行业解决方案',
};
export const relationLabels: Record<RelationType, string> = {
  supply: '供应 / 服务提供', partnership: '战略合作', control: '控股 / 子公司', investment: '参股投资',
};
export const statusLabels = { announced: '已宣布', ongoing: '进行中', completed: '已完成', ended: '已结束' };
export const viewTypes: Record<View, RelationType[]> = { industry: ['supply', 'partnership'], capital: ['control', 'investment'] };
