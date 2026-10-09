import { useRef } from 'react';
import { Info, X } from 'lucide-react';
import { dataset } from '../data';

export function AboutDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  return <>
    <button className="about-button" aria-label="关于资料" onClick={() => ref.current?.showModal()}><Info size={16} /><span>关于资料</span></button>
    <dialog ref={ref} className="about-dialog" aria-labelledby="about-title" onClick={e => { if (e.target === e.currentTarget) ref.current?.close(); }}>
      <div className="dialog-heading"><h2 id="about-title">关于这张地图</h2><button className="icon-button" aria-label="关闭资料说明" onClick={() => ref.current?.close()}><X size={20} /></button></div>
      <p>AI 经纬 · 中国 AI 公司关系地图</p>
      <dl><div><dt>资料截止</dt><dd>{dataset.metadata.cutoff}</dd></div><div><dt>近期新闻窗口</dt><dd>{dataset.metadata.newsWindowStart} — {dataset.metadata.cutoff}</dd></div><div><dt>市值快照</dt><dd>{dataset.metadata.marketCapDate ?? '尚未收录可比快照'}</dd></div></dl>
      <h3>覆盖范围</h3><p>{dataset.metadata.coverage}</p><p>{dataset.metadata.companyScope}</p>
      <h3>如何理解连线</h3><p>产业关系展示供应 / 服务与战略合作；资本关系展示控股 / 子公司与参股投资。每条线有明确证据，共同新闻不会自动生成关系线，未收录不等于现实中不存在。</p>
      <h3>节点大小</h3><p>{dataset.metadata.marketCapNote}</p><p>默认等大。市值模式按圆面积进行对数压缩以保证可读性，非严格比例；缺少可比市值的节点使用固定大小和虚线边框。融资估值仅单独展示，不用于节点大小。</p>
      <p className="minor-note">主要层级为编辑分类，不代表公司只经营这一类业务。历史公告保留原日期；新闻摘要不替代原文。</p>
      <button className="primary-button" onClick={() => ref.current?.close()}>返回地图</button>
    </dialog>
  </>;
}
